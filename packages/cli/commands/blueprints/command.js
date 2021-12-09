const fs = require("fs");
const path = require("path");
const { Command, println } = require("@ratwizard/cli");
const getProjectConfig = require("../../tools/getProjectConfig");
const getProjectRoot = require("../../tools/getProjectRoot");

module.exports = new Command().action(() => {
  const config = getProjectConfig(process.cwd());

  if (config == null) {
    return println(
      `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
    );
  }

  let blueprints = fs
    .readdirSync(path.join(__dirname, "../generate/blueprints"))
    .filter((f) => f[0] != "." && f[0] != "_" && path.extname(f) === ".js")
    .map((f) => {
      const blueprint = require(path.join(
        __dirname,
        "../generate/blueprints",
        f
      ));

      return {
        name: path.basename(f, path.extname(f)),
        blueprint: blueprint({ name: "NAME" }, config),
        path: null,
      };
    });

  if (fs.existsSync(config.path.blueprints)) {
    fs.readdirSync(config.path.blueprints)
      .filter((f) => f[0] != "." && f[0] != "_" && path.extname(f) === ".js")
      .map((f) => {
        const blueprint = require(path.join(config.path.blueprints, f));

        return {
          name: path.basename(f, path.extname(f)),
          blueprint: blueprint({ name: "NAME" }, config),
          path: path.join(
            config.path.blueprints
              .replace(config.path.root, "")
              .replace(/^\//, ""),
            f
          ),
        };
      })
      .forEach((f) => {
        if (!blueprints.some((b) => b.name === f.name)) {
          blueprints.push(f);
        }
      });
  }

  blueprints.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  for (const meta of blueprints) {
    const outPath = meta.blueprint.output
      .replace(config.path.root, "")
      .replace(/^\//, "");
    const count = meta.blueprint.files.length;

    println(
      `<cyan>${meta.name}</cyan> adds <green>${count}</green> file${
        count === 1 ? "" : "s"
      } to <bold>${outPath}</bold>` + (meta.path ? ` [${meta.path}]` : "")
    );
  }
});
