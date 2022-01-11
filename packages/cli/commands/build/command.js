const { Command, println } = require("@ratwizard/cli");

module.exports = new Command().action(async () => {
  const path = require("path");
  const fs = require("fs-extra");
  const esbuild = require("esbuild");
  const mustache = require("mustache");
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

  const buildDir = config.path.build;
  const publicDir = path.join(buildDir, "public");

  // Empties directory if it contains files.
  fs.emptyDirSync(buildDir);
  fs.emptyDirSync(publicDir);

  // Create app bundle
  const appBundle = await esbuild.build({
    entryPoints: [path.join(config.path.app, "app.js")],
    entryNames: "[dir]/[name].[hash]",
    bundle: true,
    sourcemap: true,
    minify: true,
    write: false,
    target: "es2018",
    format: "iife",
    loader: { ".js": "jsx" },
    jsxFactory: "$", // compile JSX to dolla
    jsxFragment: '""', // pass empty string for fragments
    outbase: config.path.app,
    outdir: publicDir,
  });

  // Copy public dir files (transforming .mustache)
  const srcStaticDir = path.join(config.path.app, "static");
  const bundleOut = appBundle.outputFiles.find(
    (f) => path.extname(f.path) === ".js"
  );
  const stylesOut = appBundle.outputFiles.find(
    (f) => path.extname(f.path) === ".css"
  );

  const bundlePath = bundleOut.path.replace(publicDir, "");
  const stylesPath = stylesOut ? stylesOut.path.replace(publicDir, "") : null;

  const context = {
    scripts: `<script src="${bundlePath}"></script>`,
    styles: stylesPath ? `<link rel="stylesheet" href="${stylesPath}">` : null,
    config,
  };

  println();
  println("build/");
  println("  <green>+</green> public/");

  for (const file of appBundle.outputFiles) {
    const size = superbytes(file.contents.length);
    const gsize = superbytes(gzipSize.sync(file.contents));
    const name = path.basename(file.path);

    fs.writeFileSync(file.path, file.contents);

    if (file.path.endsWith(".map")) {
      println(`    <green>+</green> ${name} - <dim>${size} on disk</dim>`);
    } else {
      println(
        `    <green>+</green> ${name} - <green>${gsize} gzipped</green> <dim>(${size} on disk)</dim>`
      );
    }
  }

  fs.readdirSync(srcStaticDir).forEach((entry) => {
    const fullPath = path.join(srcStaticDir, entry);

    if (entry.endsWith(".mustache")) {
      const name = path.basename(entry, ".mustache");
      const outPath = path.join(publicDir, name);
      const template = fs.readFileSync(fullPath, "utf8");
      const rendered = mustache.render(template, context);

      fs.writeFileSync(outPath, rendered);

      const size = superbytes(Buffer.from(rendered).length);
      const gsize = superbytes(gzipSize.sync(rendered));

      println(
        `    <green>+</green> ${name} - <green>${gsize} gzipped</green> <dim>(${size} on disk)</dim>`
      );
    } else {
      const outPath = path.join(publicDir, entry);

      fs.copySync(fullPath, outPath);

      const size = superbytes(fs.statSync(outPath).size);
      const gsize = superbytes(gzipSize.fileSync(outPath));

      println(
        `    <green>+</green> ${entry} <green>${gsize} gzipped</green> <dim>(${size} on disk)</dim>`
      );
    }
  });

  // Create server bundle (default server if no server dir is present)
  const serverEntry = path.join(config.path.server, "server.js");

  if (fs.existsSync(serverEntry)) {
    await esbuild.build({
      entryPoints: [serverEntry],
      bundle: true,
      sourcemap: true,
      minify: true,
      target: "node12",
      platform: "node",
      outfile: path.join(buildDir, "server.js"),
    });

    println("  <green>+</green> server.js");
    println("  <green>+</green> server.js.map");
  } else {
    // Use default app server
    // println(
    //   `<red><bold>ERROR</bold></red> No server found and default server is not yet implemented.`
    // );
  }

  println(`\nBundled app in <green>${Date.now() - start}</green>ms\n`);
});
