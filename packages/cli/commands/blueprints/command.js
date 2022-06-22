const fs = require("fs");
const path = require("path");
const { Command, println } = require("@ratwizard/cli");
const getProjectConfig = require("../../tools/getProjectConfig");
const loadBlueprint = require("../../tools/loadBlueprint");

module.exports = new Command().action(() => {
  const config = getProjectConfig(process.cwd());

  if (config == null) {
    return println(
      `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
    );
  }

  let blueprintsDir = path.join(__dirname, "../generate/blueprints");

  let blueprints = fs
    .readdirSync(blueprintsDir)
    .filter(
      (f) =>
        f[0] != "." &&
        f[0] != "_" &&
        fs.statSync(path.join(blueprintsDir, f)).isDirectory()
    )
    .map((f) => {
      const blueprint = loadBlueprint(
        path.join(blueprintsDir, f, "blueprint.js"),
        { name: "{{name}}" },
        config
      );

      return {
        name: path.basename(f, path.extname(f)),
        blueprint,
        path: null,
      };
    });

  if (fs.existsSync(config.path.blueprints)) {
    fs.readdirSync(config.path.blueprints)
      .filter(
        (f) =>
          f[0] != "." &&
          f[0] != "_" &&
          fs.statSync(path.join(config.path.blueprints, f)).isDirectory()
      )
      .map((f) => {
        const blueprint = loadBlueprint(
          path.join(config.path.blueprints, f, "blueprint.js"),
          { name: "[name]" },
          config
        );

        return {
          name: path.basename(f, path.extname(f)),
          blueprint,
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

  println();

  for (const meta of blueprints) {
    const outPath = meta.blueprint.output
      .replace(config.path.root, "")
      .replace(/^\//, "");
    const count = meta.blueprint.files.length;

    println(
      `<cyan>${meta.name}</cyan> adds ${count} file${
        count === 1 ? "" : "s"
      } to <bold>${outPath}</bold>` +
        (meta.path ? ` <dim>(loaded from ${meta.path})</dim>` : "")
    );
  }
});
