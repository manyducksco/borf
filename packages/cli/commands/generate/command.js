const { Command, println } = require("@ratwizard/cli");
const fs = require("fs");
const path = require("path");
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
        args.blueprint + ".js"
      );

      if (!fs.existsSync(blueprintPath)) {
        blueprintPath = path.join(
          __dirname,
          `./blueprints/${args.blueprint}.js`
        );

        if (!fs.existsSync(blueprintPath)) {
          println(
            `<red><bold>ERROR</bold></red> Blueprint not found. Received: ${args.blueprint}`
          );
          return;
        }
      }

      try {
        template = require(blueprintPath)(args, config);

        const outPath = path.isAbsolute(template.output)
          ? template.output
          : path.join(config.path.root, template.output);

        if (!outPath.startsWith(config.path.root)) {
          println(
            `\n<red><bold>ERROR</bold></red> Blueprint output folder is outside project directory. Blueprints can only generate files inside the same project.`
          );
        }

        println(
          `\nAdding <green>${template.files.length}</green> new file${
            template.files.length === 1 ? "" : "s"
          }`
        );

        template.files.forEach((file) => {
          const fullPath = path.join(outPath, file.path);

          if (!fullPath.startsWith(config.path.root)) {
            println(
              `\n<red><bold>ERROR</bold></red> File path is outside project directory. Blueprints can only generate files inside the same project.`
            );
          }

          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, file.create());

          println(
            `  <green>-></green> ${path.join(
              template.output.replace(config.path.root, "").replace(/^\//, ""),
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
