const { Command, print, println } = require("@ratwizard/cli");
const dedent = require("dedent");

module.exports = new Command()
  .option("no-browser", {
    key: "noBrowser",
    description: "Do not open a web browser",
    boolean: true,
  })
  .option("no-server", {
    key: "noServer",
    ddescription: "Do not bundle server.js",
    boolean: true,
  })
  .action(async ({ options }) => {
    const { makeState } = require("@woofjs/state");
    const EventEmitter = require("events");
    const path = require("path");
    const fs = require("fs-extra");
    const chokidar = require("chokidar");
    const express = require("express");
    const open = require("open");
    const esbuild = require("esbuild");
    const mustache = require("mustache");
    const gzipSize = require("gzip-size");
    const superbytes = require("superbytes");
    const getProjectConfig = require("../../tools/getProjectConfig");

    const events = new EventEmitter();

    const config = getProjectConfig(process.cwd());

    if (config == null) {
      println(
        `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
      );
      return;
    }

    const buildDir = path.join(config.path.temp, "build");
    const publicDir = path.join(buildDir, "public");

    // Empties directory if it contains files.
    fs.emptyDirSync(buildDir);
    fs.emptyDirSync(publicDir);

    const appBundleHash = makeState();

    const writeAppBundle = async (result) => {
      const bundleOut = result.outputFiles.find(
        (f) => path.extname(f.path) === ".js"
      );
      const stylesOut = result.outputFiles.find(
        (f) => path.extname(f.path) === ".css"
      );

      for (const file of result.outputFiles) {
        fs.writeFileSync(file.path, file.contents);
      }

      // --- Write Static Files --- //

      const srcStaticDir = path.join(config.path.app, "static");
      const bundlePath = bundleOut.path.replace(publicDir, "");
      const stylesPath = stylesOut
        ? stylesOut.path.replace(publicDir, "")
        : null;

      const context = {
        scripts: dedent`
          <script>
            const events = new EventSource("/_bundle");

            events.addEventListener("message", (message) => {
              window.location.reload();
            });

            window.addEventListener("beforeunload", () => {
              events.close();
            });
          </script>
          <script src="${bundlePath}"></script>
        `,
        styles: stylesPath
          ? `<link rel="stylesheet" href="${stylesPath}">`
          : null,
        config,
      };

      fs.readdirSync(srcStaticDir).forEach((file) => {
        const fullPath = path.join(srcStaticDir, file);

        if (file.endsWith(".mustache")) {
          const name = path.basename(file, ".mustache");
          const outPath = path.join(publicDir, name);
          const template = fs.readFileSync(fullPath, "utf8");
          const rendered = mustache.render(template, context);

          fs.writeFileSync(outPath, rendered);
        } else {
          const outPath = path.join(publicDir, file);

          fs.copySync(fullPath, outPath, { overwrite: true });
        }
      });

      const hash = path
        .basename(bundleOut.path, path.extname(bundleOut.path))
        .replace(/^app\./, "");

      appBundleHash.set(hash);
    };

    const writeServerBundle = (result) => {
      for (const file of result.outputFiles) {
        fs.writeFileSync(file.path, file.contents);
      }
    };

    // Create app bundle
    const appBundle = await esbuild.build({
      entryPoints: [path.join(config.path.app, "app.js")],
      entryNames: "[dir]/[name].[hash]",
      bundle: true,
      sourcemap: true,
      minify: false,
      write: false,
      incremental: true,
      target: "es2018",
      format: "iife",
      loader: { ".js": "jsx" },
      jsxFactory: "$", // compile JSX to dolla
      jsxFragment: '""', // pass empty string for fragments
      outbase: config.path.app,
      outdir: publicDir,
    });

    writeAppBundle(appBundle);

    const serverEntry = path.join(config.path.server, "server.js");

    if (fs.existsSync(serverEntry) && !options.noServer) {
      const serverBundle = await esbuild.build({
        entryPoints: [serverEntry],
        bundle: true,
        sourcemap: true,
        minify: true,
        write: false,
        incremental: true,
        target: "node12",
        platform: "node",
        outfile: path.join(buildDir, "server.js"),
      });

      writeServerBundle(serverBundle);
    }

    /*==========================*\
    ||      Watch & Bundle      ||
    \*==========================*/

    const appWatcher = chokidar.watch([`${config.path.app}/**/*`], {
      persistent: true,
      ignoreInitial: true,
    });

    appWatcher.on("all", async () => {
      const start = Date.now();
      writeAppBundle(await appBundle.rebuild());
      println(
        `<cyan>APP</cyan> rebuilt in <green>${Date.now() - start}ms</green>`
      );
    });

    if (fs.existsSync(serverEntry) && !options.noServer) {
      const serverWatcher = chokidar.watch(`${config.path.server}/**/*`, {
        persistent: true,
        ignoreInitial: true,
      });

      serverWatcher.on("all", async () => {
        const start = Date.now();
        writeServerBundle(await serverBundle.rebuild());
        println(
          `<magenta>SERVER</magenta> rebuilt in <green>${
            Date.now() - start
          }ms</green>`
        );
      });
    }

    /*==========================*\
    ||          Server          ||
    \*==========================*/

    const app = express();

    ////
    // This server exists to serve the app and proxy requests to the API server.
    // Why proxy? This server can inject things and handle Server Sent Events for auto-reload.
    ////

    // TODO: Proxy requests with relative URLs to the server if it's running.

    app.use(express.static(publicDir));

    app.listen(7072, () => {
      if (options.noBrowser) {
        println(
          `\nVisit <green>http://localhost:7072</green> in a browser to see app.`
        );
      } else {
        open("http://localhost:7072");
      }

      println(
        `\n<magenta>CLI</magenta> app will auto reload when files are saved`
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

      const unwatch = appBundleHash.watch((value) => {
        res.write(`data: ${value}\n\n`);
      });

      res.on("close", () => {
        unwatch();
        res.end();
      });
    });

    app.get("*", (req, res, next) => {
      const extname = path.extname(req.path);

      if (extname === "") {
        res.sendFile(path.join(bundleDir, "index.html"));
      } else {
        next();
      }
    });

    process.on("exit", () => {
      fs.rmSync(bundleDir, { recursive: true, force: true });
    });
  });

function getClock(date = new Date()) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const meridiem = hours > 12 ? "PM" : "AM";

  hours = hours % 12;

  return (
    hours.toString() +
    ":" +
    minutes.toString().padStart(2, "0") +
    " " +
    meridiem
  );
}
