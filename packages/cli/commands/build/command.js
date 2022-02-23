const { Command, println } = require("@ratwizard/cli");
const makeAppBundle = require("./makeAppBundle");

module.exports = new Command().action(async () => {
  const path = require("path");
  const gzipSize = require("gzip-size");
  const superbytes = require("superbytes");
  const getProjectConfig = require("../../tools/getProjectConfig");

  const config = getProjectConfig(process.cwd());

  if (config == null) {
    println(
      `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
    );
    return;
  }

  const start = Date.now();

  const appBundle = await makeAppBundle(config).build();

  println();
  println("build/");
  println("  <green>+</green> public/");

  for (const file of appBundle.writtenFiles) {
    if (file.contents) {
      const size = superbytes(file.contents.length);
      const gsize = superbytes(gzipSize.sync(file.contents));
      const name = path.basename(file.path);

      if (file.path.endsWith(".map")) {
        println(`    <green>+</green> ${name} - <dim>${size} on disk</dim>`);
      } else {
        println(
          `    <green>+</green> ${name} - <green>${gsize} gzipped</green> <dim>(${size} on disk)</dim>`
        );
      }
    } else {
      const name = path.basename(file.path);
      println(`    <green>+</green> ${name}/* <dim>(directory)</dim>`);
    }
  }

  println(`\nBundled app in <green>${Date.now() - start}</green>ms\n`);
});
