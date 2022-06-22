#!/usr/bin/env node

const { program, println } = require("@ratwizard/cli");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const express = require("express");
const buildViews = require("./scripts/build-views");

program
  .command("start", {
    description: "starts the server",
    action: async ({ options }) => {
      await buildViews({
        clientRoot: process.cwd(),
        buildRoot: path.join(process.cwd(), "temp", "views"),
      });

      await serve();
    },
  })
  .command("build", {
    description: "",
    options: {
      "-o, --output <value>": {
        description: "path to output folder",
        required: true,
      },
    },
    action: async ({ options }) => {
      console.log("built", options);
    },
  });

program.run(process.argv);

// async function buildClientOnce(options) {
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

async function serve() {
  const app = express();

  const frameDir = path.resolve("temp/views/bundle/public");
  const runnerDir = path.join(__dirname, "build/public");

  ////
  // This server exists to serve the app and proxy requests to the API server.
  // Why proxy? This server can inject things and handle Server Sent Events for auto-reload.
  ////

  // TODO: Proxy requests with relative URLs to the server if it's running.
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

    const unwatch = $bundleId.watch((value) => {
      res.write(`data: ${value}\n\n`);
    });

    res.on("close", () => {
      unwatch();
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
