const { Command, println } = require("@ratwizard/cli");
const makeAppBundle = require("../build/makeAppBundle");

module.exports = new Command()
  .option("no-browser", {
    key: "noBrowser",
    description: "Do not open a web browser",
    boolean: true,
  })
  .action(async ({ options }) => {
    const { makeState } = require("@woofjs/state");
    const path = require("path");
    const fs = require("fs-extra");
    const chokidar = require("chokidar");
    const express = require("express");
    const open = require("open");
    const getProjectConfig = require("../../tools/getProjectConfig");

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

    const $appBundleId = makeState(0);

    // Create app bundle
    const appBundle = await makeAppBundle({
      ...config,
      path: {
        ...config.path,
        build: buildDir,
      },
      static: {
        ...config.static,
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
    }).buildIncremental();

    /*==========================*\
    ||      Watch & Bundle      ||
    \*==========================*/

    const appWatcher = chokidar.watch([`${config.path.app}/**/*`], {
      persistent: true,
      ignoreInitial: true,
    });

    appWatcher.on("all", async () => {
      const start = Date.now();
      await appBundle.rebuild();
      $appBundleId.set((current) => current + 1);
      println(
        `<cyan>APP</cyan> rebuilt in <green>${Date.now() - start}ms</green>`
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

      const unwatch = $appBundleId.watch((value) => {
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
