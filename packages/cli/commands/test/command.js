const { Command, print, println } = require("@ratwizard/cli");

module.exports = new Command()
  .option("cli", {
    description:
      "Run tests in this terminal instead of a browser. Runs once and then exits unless used with --watch option.",
    boolean: true,
  })
  .option("watch", {
    description:
      "Use with --cli option. Watches for changes and re-runs tests automatically.",
    boolean: true,
  })
  .option("no-browser", {
    key: "noBrowser",
    description:
      "Do not open a web browser when starting the browser-based test runner",
    boolean: true,
  })
  .action(async ({ options }) => {
    if (options.cli) {
      println(`\n<bold><red>TODO</red></bold> Not yet implemented.`);
      return;
    } else {
      if (options.watch) {
        println(
          `\n<bold><yellow>WARNING</yellow></bold> --watch has no effect with the browser test runner`
        );
      }
    }

    const path = require("path");
    const fs = require("fs-extra");
    const open = require("open");
    const express = require("express");
    const esbuild = require("esbuild");
    const chokidar = require("chokidar");
    const { state } = require("@manyducksco/woof/node");
    const getProjectConfig = require("../../tools/getProjectConfig");

    const config = getProjectConfig(process.cwd());

    if (config == null) {
      println(
        `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
      );
      return;
    }

    const appDir = config.path.app;
    const bundleDir = path.join(config.path.temp, "apptest");
    const webRunnerDir = path.join(__dirname, "webrunner");

    /*==========================*\
    ||      Watch & Bundle      ||
    \*==========================*/

    fs.mkdirSync(bundleDir, { recursive: true });

    const ENTRY_PATH = path.join(bundleDir, "_suites.js");
    const BUNDLE_PATH = path.join(bundleDir, "suites.bundle.js");

    let imports = [];
    let registrations = [];

    function scan(dir) {
      fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        if (file != "node_modules" && fs.statSync(fullPath).isDirectory()) {
          scan(fullPath);
        } else {
          if (file.toLowerCase().endsWith(".test.js")) {
            const relDir = dir.replace(appDir, "").replace(/^\//, "");

            const importName =
              relDir
                .split("/")
                .map((f) => f[0].toUpperCase() + f.slice(1))
                .join("") + "Tests";

            imports.push(`import ${importName} from "${fullPath}";`);
            registrations.push(`register("${relDir}", ${importName});`);
          }
        }
      });
    }

    function build() {
      scan(appDir);

      let index = "";

      imports.forEach((line) => {
        index += line + "\n";
      });

      index += "\n";
      index += "export default function (register) {\n";

      registrations.forEach((line) => {
        index += "  " + line + "\n";
      });

      index += "}";

      // fs.copySync(templateDir, filesDir);
      fs.writeFileSync(ENTRY_PATH, index);

      fs.copyFileSync(
        path.join(webRunnerDir, "index.html"),
        path.join(bundleDir, "index.html")
      );
      fs.copyFileSync(
        path.join(webRunnerDir, "index.css"),
        path.join(bundleDir, "index.css")
      );
      fs.copyFileSync(
        path.join(webRunnerDir, "es-module-shims.js"),
        path.join(bundleDir, "es-module-shims.js")
      );
    }

    // Symlink node modules to load @manyducksco/woof from node_modules in the browser
    try {
      fs.symlinkSync(
        path.join(__dirname, "../../node_modules"),
        path.join(bundleDir, "node_modules")
      );
    } catch (err) {}

    const watcher = chokidar.watch([`${appDir}/**/*`], {
      persistent: true,
      ignoreInitial: true,
    });

    const buildId = state(0, {
      methods: {
        increment: (value) => value + 1,
      },
    });

    build(); // Do initial build

    const testBundle = await esbuild.build({
      entryPoints: [ENTRY_PATH],
      bundle: true,
      sourcemap: true,
      target: "es2018",
      format: "esm",
      incremental: true,
      loader: { ".js": "jsx" },
      jsxFactory: "$", // compile JSX to dolla
      jsxFragment: '""', // pass empty string for fragments
      external: ["@manyducksco/woof", "@manyducksco/woof/test"],
      outfile: BUNDLE_PATH,
    });

    const runnerBundle = await esbuild.build({
      entryPoints: [path.join(webRunnerDir, "index.js")],
      bundle: true,
      sourcemap: true,
      target: "es2018",
      format: "esm",
      incremental: true,
      external: ["@manyducksco/woof", "@manyducksco/woof/test", "$bundle"],
      outfile: path.join(bundleDir, "index.js"),
    });

    const bundle = () => {
      imports = [];
      registrations = [];

      const start = Date.now();

      print(`  -> Rebuilding... `);
      build();
      testBundle.rebuild();
      runnerBundle.rebuild();

      println(
        `finished in <green>${
          Date.now() - start
        }ms</green> <gray>[${getClock()}]</gray>`
      );

      buildId.increment();
    };

    watcher.on("all", bundle);

    /*==========================*\
    ||          Server          ||
    \*==========================*/

    const app = express();

    app.use(express.static(bundleDir));

    app.listen(7071, () => {
      if (options.noBrowser) {
        println(
          `\nVisit <green>http://localhost:7071</green> in a browser to see tests.`
        );
      } else {
        open("http://localhost:7071");
      }

      println("\nWatching for file changes");
    });

    app.get("/events", (req, res) => {
      res.set({
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
      });
      res.flushHeaders();

      // Tell the client to retry every 10 seconds if connectivity is lost
      res.write("retry: 10000\n\n");

      const cancel = buildId((value) => {
        res.write(`data: ${value}\n\n`);
      });

      res.on("close", () => {
        cancel();
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
