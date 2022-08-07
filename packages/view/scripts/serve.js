// 1. Get project root
// 2. Recurse to find all .view.* files
// 3. Build an index file importing all views and exposing an object on `window`

import { println } from "@ratwizard/cli";
import { esbuildConfig } from "@woofjs/build";
import { fileURLToPath } from "url";
import fs from "fs-extra";
import path from "path";
import esbuild from "esbuild";
import chokidar from "chokidar";
import express from "express";
import getPort from "get-port";
import EventEmitter from "events";

const isIgnored = /node_modules|^\./;
const isView = /\.view\.m?[jt]sx?$/;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function serve(options) {
  const app = express();

  const serverPort = await getPort({
    port: [5000, 5001, 5002, 5003, 5004, 5005],
  });

  const frameDir = path.resolve("temp/views/bundle/static");
  const runnerDir = path.join(__dirname, "../build/static");

  const events = new EventEmitter();

  options = {
    ...options,
    static: {
      injectScripts: [
        `
          <script>
            const events = new EventSource("/_bundle");

            events.addEventListener("message", (message) => {
              window.location.reload();
            });

            window.addEventListener("beforeunload", () => {
              events.close();
            });
          </script>
        `,
      ],
    },
  };

  let bundleId = 0;
  const bundle = await buildViews(options, { incremental: true });

  const clientWatcher = chokidar.watch([`${options.clientRoot}/**/*`], {
    persistent: true,
    ignoreInitial: true,
  });

  clientWatcher.on("all", async () => {
    const start = Date.now();
    await bundle.rebuild();

    events.emit("bundle", bundleId++);

    println(`rebuilt in <green>${Date.now() - start}ms</green>`);
  });

  ////
  // This server exists to serve the app and proxy requests to the API server.
  // Why proxy? This server can inject things and handle Server Sent Events for auto-reload.
  ////

  app.use(express.static(runnerDir));
  app.use(express.static(frameDir));

  app.listen(serverPort, () => {
    println(
      `\nSee your views in a browser at <green>http://localhost:${serverPort}</green>`
    );
  });

  app.get("/_bundle", (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write("retry: 10000\n\n");

    function update(bundleId) {
      res.write(`data: ${bundleId}\n\n`);
    }

    events.on("bundle", update);

    res.on("close", () => {
      events.off("bundle", update);
      res.end();
    });
  });

  app.get("/frame.html", (req, res) => {
    const frameIndex = path.join(frameDir, "index.html");
    const stream = fs.createReadStream(frameIndex);
    stream.pipe(res);
  });

  app.get("*", (req, res, next) => {
    const extname = path.extname(req.path);

    if (extname === "") {
      res.sendFile(path.join(runnerDir, "index.html"));
    } else {
      next();
    }
  });
}

async function buildViews(options) {
  const frameRoot = path.join(__dirname, "../frame");
  const bundleSrcRoot = path.join(options.buildRoot, "src");
  const bundleRoot = path.join(options.buildRoot, "bundle");

  // Make sure build directory is empty and subdirectories exist.
  await fs.emptyDir(options.buildRoot);
  await fs.ensureDir(bundleSrcRoot);
  await fs.ensureDir(bundleRoot);

  const views = findViews(options.clientRoot);

  let index = "";
  let nextId = 0;

  // Hack CSS imports into frame index so they get included in the build.
  if (options.include?.styles && options.include?.styles?.length > 0) {
    for (const file of options.include.styles) {
      const fileName = path.basename(file);
      const absolutePath = path.resolve(file);
      const newPath = path.join(bundleSrcRoot, fileName);

      await fs.copyFile(absolutePath, newPath);

      index += `import "./${fileName}";\n`;
    }
  }

  // Add imports
  for (const view of views) {
    view.id = nextId++;
    index += `import View${view.id} from "${view.absolutePath}";\n`;
  }

  index += "export default [\n";

  for (const view of views) {
    index += `  { id: ${view.id}, absolutePath: "${view.absolutePath}", relativePath: "${view.relativePath}", componentName: "${view.componentName}", exports: View${view.id} },\n`;
  }

  index += "];\n";

  // Copy /files to /src
  await fs.copy(frameRoot, bundleSrcRoot);

  // Copy project's `.view/static` files.
  if (
    options.projectViewStaticRoot &&
    fs.existsSync(options.projectViewStaticRoot)
  ) {
    await fs.copy(
      options.projectViewStaticRoot,
      path.join(bundleSrcRoot, "static")
    );
  }

  // Write views index file
  const outputPath = path.join(bundleSrcRoot, "views-index.js");
  await fs.writeFile(outputPath, index);

  const bundle = await esbuild.build({
    ...esbuildConfig,
    entryPoints: [path.join(bundleSrcRoot, "views.js")],
    entryNames: "[dir]/views",
    outdir: bundleRoot,
    minify: options.minify,
    incremental: options.incremental,
    // plugins: [
    //   stylePlugin({
    //     postcss: {
    //       plugins: woofConfig.client?.postcss?.plugins || [],
    //     },
    //     cssModulesOptions: {
    //       generateScopedName: function (name, filename, css) {
    //         const file = path.basename(filename, ".module.css");
    //         const hash = xxhash
    //           .h64()
    //           .update(css)
    //           .digest()
    //           .toString(16)
    //           .slice(0, 5);

    //         return file + "_" + name + "_" + hash;
    //       },
    //     },
    //   }),
    // ],
  });

  return bundle;
}

function findViews(folder, root = null) {
  const contents = fs.readdirSync(folder);
  const views = [];

  if (root == null) {
    root = folder;
  }

  for (const name of contents) {
    if (!isIgnored.test(name)) {
      const fullPath = path.join(folder, name);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        views.push(...findViews(fullPath, root));
      } else if (isView.test(name)) {
        views.push({
          absolutePath: fullPath,
          relativePath: fullPath.replace(root, "").replace(/^\//, ""),
          componentName: getComponentName(name),
        });
      }
    }
  }

  return views;
}

function getComponentName(filePath) {
  return path.basename(filePath).replace(isView, "");
}
