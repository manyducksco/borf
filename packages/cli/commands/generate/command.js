const { Command, println } = require("@ratwizard/cli");
const fs = require("fs");
const path = require("path");
const loadBlueprint = require("../../tools/loadBlueprint");
const getProjectConfig = require("../../tools/getProjectConfig");

module.exports = new Command()
  .description("Creates project files from blueprints")
  .arg("blueprint", {
    description: "",
  })
  .arg("name", {
    description: "Name of the item to create (e.g. NavHeader)",
  })
  .arg("options", {
    description: "Other args to be passed to the blueprint",
    splat: true,
    optional: true,
  })
  .examples(["{*} component NavHeader", "{*} service Messages"])
  .action(({ args }) => {
    const config = getProjectConfig(process.cwd());

    if (config == null) {
      return println(
        `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
      );
    }

    if (config) {
      let blueprintPath = path.join(
        config.path.blueprints,
        args.blueprint,
        "blueprint.js"
      );

      if (!fs.existsSync(blueprintPath)) {
        blueprintPath = path.join(
          __dirname,
          `./blueprints/${args.blueprint}/blueprint.js`
        );

        if (!fs.existsSync(blueprintPath)) {
          println(
            `<red><bold>ERROR</bold></red> Blueprint not found. Received: ${args.blueprint}`
          );
          return;
        }
      }

      try {
        const blueprint = loadBlueprint(blueprintPath, args, config);

        const outDir = path.isAbsolute(blueprint.output)
          ? blueprint.output
          : path.join(config.path.root, blueprint.output);

        if (!outDir.startsWith(config.path.root)) {
          println(
            `\n<red><bold>ERROR</bold></red> Blueprint output folder is outside project directory. Blueprints can only generate files inside the same project.`
          );
        }

        println(
          `\nAdding <green>${blueprint.files.length}</green> new file${
            blueprint.files.length === 1 ? "" : "s"
          }`
        );

        blueprint.files.forEach((file) => {
          const fullPath = path.join(outDir, file.path);

          if (!fullPath.startsWith(config.path.root)) {
            println(
              `\n<red><bold>ERROR</bold></red> File path is outside project directory. Blueprints can only generate files inside the same project.`
            );
          }

          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, file.create());

          println(
            `  <green>-></green> ${path.join(
              blueprint.output.replace(config.path.root, "").replace(/^\//, ""),
              file.path
            )}`
          );
        });
      } catch (err) {
        throw err;
      }
    } else {
      throw new Error(
        `Not in woof project directory (can't find woof.config.js in '${process.cwd()}')`
      );
    }
  });
