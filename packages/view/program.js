#!/usr/bin/env node

const { program, println } = require("@ratwizard/cli");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const express = require("express");

program
  .command("start", {
    description: "starts the server",
    action: () => {
      console.log("started");
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
    action: ({ options }) => {
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

// async function watchClient(options) {
//   const config = {
//     entryPath: path.join(process.cwd(), options.client),
//     outputPath: path.join(process.cwd(), options.output),
//     esbuild: {
//       minify: options.minify,
//       inject: [path.join(__dirname, "utils/jsx-shim.js")],
//     },
//     static: {
//       injectScripts: [
//         `
//           <script>
//             const events = new EventSource("/_bundle");

//             events.addEventListener("message", (message) => {
//               window.location.reload();
//             });

//             window.addEventListener("beforeunload", () => {
//               events.close();
//             });
//           </script>
//         `,
//       ],
//     },
//   };

//   const buildDir = config.outputPath;
//   const publicDir = path.join(buildDir, "public");
//   const entryDir = path.dirname(config.entryPath);

//   // Empties directory if it contains files.
//   fs.emptyDirSync(buildDir);
//   fs.emptyDirSync(publicDir);

//   const $bundleId = makeState(0);

//   // Create app bundle
//   const clientBundle = await buildClient(config).buildIncremental();

//   /*==========================*\
//   ||      Watch & Bundle      ||
//   \*==========================*/

//   const clientWatcher = chokidar.watch([`${entryDir}/**/*`], {
//     persistent: true,
//     ignoreInitial: true,
//   });

//   clientWatcher.on("all", async () => {
//     const start = Date.now();
//     await clientBundle.rebuild();
//     $bundleId.set((current) => current + 1);
//     println(
//       `<cyan>CLIENT</cyan> rebuilt in <green>${Date.now() - start}ms</green>`
//     );
//   });

//   /*==========================*\
//   ||          Server          ||
//   \*==========================*/

//   const app = express();

//   ////
//   // This server exists to serve the app and proxy requests to the API server.
//   // Why proxy? This server can inject things and handle Server Sent Events for auto-reload.
//   ////

//   // TODO: Proxy requests with relative URLs to the server if it's running.

//   app.use(express.static(publicDir));

//   app.listen(7072, () => {
//     println(
//       `\nVisit <green>http://localhost:7072</green> in a browser to see app.`
//     );

//     println(
//       `\n<magenta>CLIENT</magenta> app will auto reload when files are saved`
//     );
//   });

//   app.get("/_bundle", (req, res) => {
//     res.set({
//       "Cache-Control": "no-cache",
//       "Content-Type": "text/event-stream",
//       Connection: "keep-alive",
//     });
//     res.flushHeaders();

//     // Tell the client to retry every 10 seconds if connectivity is lost
//     res.write("retry: 10000\n\n");

//     const unwatch = $bundleId.watch((value) => {
//       res.write(`data: ${value}\n\n`);
//     });

//     res.on("close", () => {
//       unwatch();
//       res.end();
//     });
//   });

//   app.get("*", (req, res, next) => {
//     const extname = path.extname(req.path);

//     if (extname === "") {
//       res.sendFile(path.join(buildDir, "index.html"));
//     } else {
//       next();
//     }
//   });
// }
