const { Command, print, println } = require("@ratwizard/cli");

module.exports = new Command().action(() => {
  const path = require("path");
  const fs = require("fs-extra");
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

  const srcDir = config.path.src;
  const bundleDir = path.join(config.path.temp, "miru");
  const serverDir = path.join(__dirname, "server");

  fs.mkdirSync(bundleDir, { recursive: true });

  let imports = [];
  let registrations = [];

  function scan(dir) {
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file);
      if (file != "node_modules" && fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else {
        if (file.toLowerCase().endsWith(".miru.js")) {
          const relDir = dir.replace(srcDir, "").replace(/^\//, "");

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
    scan(srcDir);

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

    const ENTRY_PATH = path.join(bundleDir, "_suites.js");
    const BUNDLE_PATH = path.join(bundleDir, "suites.bundle.js");

    // fs.copySync(templateDir, filesDir);
    fs.writeFileSync(ENTRY_PATH, index);

    fs.copyFileSync(
      path.join(serverDir, "index.html"),
      path.join(bundleDir, "index.html")
    );
    fs.copyFileSync(
      path.join(serverDir, "index.css"),
      path.join(bundleDir, "index.css")
    );
    fs.copyFileSync(
      path.join(serverDir, "es-module-shims.js"),
      path.join(bundleDir, "es-module-shims.js")
    );

    esbuild.buildSync({
      entryPoints: [ENTRY_PATH],
      bundle: true,
      sourcemap: true,
      target: "es2018",
      format: "esm",
      external: ["@manyducksco/woof", "@manyducksco/woof/test"],
      outfile: BUNDLE_PATH,
    });

    esbuild.buildSync({
      entryPoints: [path.join(serverDir, "index.js")],
      bundle: true,
      sourcemap: true,
      target: "es2018",
      format: "esm",
      external: ["@manyducksco/woof", "@manyducksco/woof/test", "$bundle"],
      outfile: path.join(bundleDir, "index.js"),
    });
  }

  try {
    fs.symlinkSync(
      path.join(__dirname, "../../node_modules"),
      path.join(bundleDir, "node_modules")
    );
  } catch (err) {}

  const watcher = chokidar.watch([`${srcDir}/**/*`], {
    persistent: true,
    ignoreInitial: true,
  });

  const buildId = state(0, {
    methods: {
      increment: (value) => value + 1,
    },
  });

  const bundle = () => {
    imports = [];
    registrations = [];

    const now = new Date();

    print(`  -> Rebuilding...`);
    build();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const meridiem = hours > 12 ? "PM" : "AM";

    hours = hours % 12;

    const time =
      hours.toString() +
      ":" +
      minutes.toString().padStart(2, "0") +
      " " +
      meridiem;
    println(
      ` finished in <green>${
        Date.now() - now.valueOf()
      }ms</green> <gray>[${time}]</gray>`
    );

    buildId.increment();
  };

  watcher.on("ready", bundle);
  watcher.on("add", bundle).on("unlink", bundle).on("change", bundle);

  const app = express();

  app.use(express.static(bundleDir));

  app.listen(7071, () => {
    println(
      `\nVisit <green>http://localhost:7071</green> in a browser to miru.\n`
    );

    println("Watching for file changes");
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
      console.log(`sent: ${value}`);
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
