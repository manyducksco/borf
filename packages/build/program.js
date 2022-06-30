#!/usr/bin/env node

const { program, println } = require("@ratwizard/cli");
const EventEmitter = require("events");
const path = require("path");
const fs = require("fs-extra");
const chokidar = require("chokidar");
const express = require("express");
const gzipSize = require("gzip-size");
const superbytes = require("superbytes");
const findWoofConfig = require("./utils/findWoofConfig");

const buildClient = require("./scripts/build-client");

program
  .option("-c, --client <value>", {
    description: "path to client bundle entry point",
  })
  .option("-s, --server <value>", {
    description: "path to server bundle entry point",
  })
  .option("-o, --output <value>", {
    description: "path to output folder",
    required: true,
  })
  .option("-w, --watch", {
    description: "watch for changes and rebuild automatically",
    boolean: true,
  })
  .option("--minify", {
    description:
      "reduce bundle size at the cost of readability; recommended for production builds",
    boolean: true,
  })
  .action(async ({ options }) => {
    const promises = [];

    // TODO: Find nearest woof.config.js and extract .build settings from it.
    const woofConfig = findWoofConfig();

    if (woofConfig && woofConfig.build) {
      options = {
        ...woofConfig.build,
        ...options,
      };
    }

    console.log(options);

    if (options.client) {
      if (options.watch) {
        promises.push(watchClient(options));
      } else {
        const { writtenFiles, time } = await buildClientOnce(options);

        println();
        println("build/");
        println("  <green>+</green> public/");

        for (const file of writtenFiles) {
          if (file.type === "directory") {
            println(
              `    <green>+</green> ${file.name}/* <dim>(directory)</dim>`
            );
          } else {
            if (file.gzipSize != null) {
              println(
                `    <green>+</green> ${file.name} - <green>${file.gzipSize} gzipped</green> <dim>(${file.size} on disk)</dim>`
              );
            } else {
              println(
                `    <green>+</green> ${file.name} - <dim>${file.size} on disk</dim>`
              );
            }
          }
        }

        println(`\nBundled app in <green>${time}</green>ms\n`);
      }
    }

    if (options.server) {
      println("<yellow>Server builds are not implemented yet.</yellow>");
    }

    await Promise.all(promises);
  });

if (!module.parent) {
  // Called from CLI
  program.run(process.argv);
} else {
  // Imported from another file
  module.exports = { build: buildClientOnce, watch: watchClient };
}

async function buildClientOnce(options, { incremental = false } = {}) {
  const config = {
    ...options,
    entryPath: path.resolve(options.client),
    outputPath: path.resolve(options.output),
    esbuild: {
      ...(options.esbuild || {}),
      minify: options.minify,
      inject: [path.join(__dirname, "utils/jsx-shim-client.js")],
    },
  };

  const start = Date.now();

  const clientBundle = await buildClient(config);

  if (!incremental) {
    clientBundle.done();
  }

  const writtenFiles = [];

  for (const file of clientBundle.writtenFiles) {
    if (file.contents) {
      writtenFiles.push({
        type: "file",
        size: superbytes(file.contents.length),
        gzipSize: file.path.endsWith(".js")
          ? superbytes(gzipSize.sync(file.contents))
          : null,
        name: path.basename(file.path),
      });
    } else {
      writtenFiles.push({
        type: "folder",
        name: path.basename(file.path),
      });
    }
  }

  return {
    ...clientBundle,
    writtenFiles,
    time: Date.now() - start,
  };
}

async function watchClient(options) {
  const config = {
    entryPath: path.join(process.cwd(), options.client),
    outputPath: path.join(process.cwd(), options.output),
    esbuild: {
      minify: options.minify,
      inject: [path.join(__dirname, "utils/jsx-shim-client.js")],
    },
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

  const buildDir = config.outputPath;
  const publicDir = path.join(buildDir, "public");
  const entryDir = path.dirname(config.entryPath);

  // Empties directory if it contains files.
  fs.emptyDirSync(buildDir);
  fs.emptyDirSync(publicDir);

  let bundleId = 0;
  const bundleEmitter = new EventEmitter();

  // Create app bundle
  const clientBundle = await buildClient(config);

  /*==========================*\
  ||      Watch & Bundle      ||
  \*==========================*/

  const clientWatcher = chokidar.watch([`${entryDir}/**/*`], {
    persistent: true,
    ignoreInitial: true,
  });

  clientWatcher.on("all", async () => {
    const start = Date.now();
    await clientBundle.rebuild();

    bundleEmitter.emit("bundle", bundleId++);

    println(
      `<cyan>CLIENT</cyan> rebuilt in <green>${Date.now() - start}ms</green>`
    );
  });

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
    println(
      `\nVisit <green>http://localhost:7072</green> in a browser to see app.`
    );

    println(
      `\n<magenta>CLIENT</magenta> app will auto reload when files are saved`
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

    const update = (id) => {
      res.write(`data: ${id}\n\n`);
    };

    bundleEmitter.on("bundle", update);

    res.on("close", () => {
      bundleEmitter.off("bundle", update);
      res.end();
    });
  });

  app.get("*", (req, res, next) => {
    const extname = path.extname(req.path);

    if (extname === "") {
      res.sendFile(path.join(buildDir, "index.html"));
    } else {
      next();
    }
  });
}
