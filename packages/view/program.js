#!/usr/bin/env node

const { program, println, Command } = require("@ratwizard/cli");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const express = require("express");
const buildViews = require("./scripts/build-views");
const EventEmitter = require("events");
const findWoofConfig = require("./utils/findWoofConfig");

program.command("start", {
  description: "starts an HTTP server for views",
  examples: [
    "{*} ./client",
    "{*} ./client --include-css client/styles/global.css,client/styles/ui.css",
  ],
  options: {
    "--include-styles <paths>": {
      description: "path to CSS files to include, comma separated",
      key: "includeStyles",
    },
  },
  args: [
    {
      name: "path",
      description: "root directory of your app",
    },
  ],
  action: async ({ args, options }) => {
    const woofConfig = await findWoofConfig();

    const includeStyles = [];

    // Add styles from CLI argument.
    if (options.includeStyles) {
      includeStyles.push(
        ...options.includeStyles.split(",").filter((x) => x.trim() !== "")
      );
    }

    // Add styles from woof config file.
    if (woofConfig?.view?.include?.styles) {
      includeStyles.push(
        ...woofConfig.view.include.styles.filter((x) => x.trim() !== "")
      );
    }

    await serve({
      ...(woofConfig?.build || {}),
      clientRoot: path.resolve(args.path),
      buildRoot: path.join(process.cwd(), "temp", "views"),
      projectViewStaticRoot: path.join(process.cwd(), ".view", "static"), // Replace the view index.html.mustache and/or include extra files for your project.
      include: {
        styles: includeStyles,
      },
    });
  },
});
// .command("build", {
//   description:
//     "builds views into a folder full of static files you can host anywhere",
//   examples: [
//     "{*} build ./client",
//     "{*} build ./client --include-css client/styles/global.css,client/styles/ui.css",
//   ],
//   options: {
//     "--include-css <paths>": {
//       description: "path to CSS files to include, comma separated",
//       key: "includeCSS",
//     },
//     "-o, --output <path>": {
//       description: "path to output folder",
//       required: true,
//     },
//   },
//   args: [
//     {
//       name: "path",
//       description: "root directory of your app",
//     },
//   ],
//   action: async ({ args, options }) => {
//     await build({
//       clientRoot: path.resolve(args.path),
//       buildRoot: path.join(process.cwd(), "temp", "views"),
//       includeCSS: options.includeCSS
//         ? options.includeCSS.split(",").filter((x) => x.trim() !== "")
//         : [],
//     });
//   },
// });

program.run(process.argv);

// async function build(options) {
//   const config = {
//     entryPath: path.join(process.cwd(), options.client),
//     outputPath: path.join(process.cwd(), options.output),
//     esbuild: {
//       minify: options.minify,
//       inject: [path.join(__dirname, "utils/jsx-shim.js")],
//     },
//   };

//   const start = Date.now();
//   const clientBundle = await buildClient(config).build();

//   println();
//   println("build/");
//   println("  <green>+</green> public/");

//   for (const file of clientBundle.writtenFiles) {
//     if (file.contents) {
//       const size = superbytes(file.contents.length);
//       const gsize = superbytes(gzipSize.sync(file.contents));
//       const name = path.basename(file.path);

//       if (file.path.endsWith(".map")) {
//         println(`    <green>+</green> ${name} - <dim>${size} on disk</dim>`);
//       } else {
//         println(
//           `    <green>+</green> ${name} - <green>${gsize} gzipped</green> <dim>(${size} on disk)</dim>`
//         );
//       }
//     } else {
//       const name = path.basename(file.path);
//       println(`    <green>+</green> ${name}/* <dim>(directory)</dim>`);
//     }
//   }

//   println(`\nBundled app in <green>${Date.now() - start}</green>ms\n`);
// }

async function serve(options) {
  const app = express();

  const frameDir = path.resolve("temp/views/bundle/public");
  const runnerDir = path.join(__dirname, "build/public");

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

  app.listen(4200, () => {
    println(
      `\nVisit <green>http://localhost:4200</green> in a browser to see views.`
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
    res.sendFile(path.join(frameDir, "index.html"));
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
