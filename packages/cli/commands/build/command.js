const { Command, println } = require("@ratwizard/cli");

module.exports = new Command().action(async () => {
  const path = require("path");
  const fs = require("fs-extra");
  const esbuild = require("esbuild");
  const mustache = require("mustache");
  const { customAlphabet } = require("nanoid");
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
  const bundleId = customAlphabet("abcdef0123456789", 8)();
  const bundleName = `app.${bundleId}.js`;
  const stylesName = `app.${bundleId}.css`;

  const appBundle = await esbuild.build({
    entryPoints: [path.join(config.path.app, "app.js")],
    bundle: true,
    sourcemap: true,
    minify: true,
    target: "es2018",
    format: "iife",
    loader: { ".js": "jsx" },
    jsxFactory: "$", // compile JSX to dolla
    jsxFragment: '""', // pass empty string for fragments
    outfile: path.join(publicDir, bundleName),
  });

  const wroteStyles = fs.existsSync(path.join(publicDir, stylesName));

  // Copy public dir files (transforming .mustache)
  const srcStaticDir = path.join(config.path.app, "static");
  const context = {
    bundlePath: "/" + bundleName,
    stylesPath: wroteStyles ? "/" + stylesName : null,
    config,
  };

  const bundleSize = superbytes(
    fs.statSync(path.join(publicDir, bundleName)).size
  );
  const bundleSizeGzip = superbytes(
    gzipSize.fileSync(path.join(publicDir, bundleName))
  );

  println();
  println("build/");
  println("  <green>+</green> public/");
  println(
    `    <green>+</green> ${bundleName} <dim>(${bundleSize} / ${bundleSizeGzip} gzipped)</dim>`
  );
  println(`    <green>+</green> ${bundleName}.map`);
  if (wroteStyles) {
    const stylesSize = superbytes(
      fs.statSync(path.join(publicDir, stylesName)).size
    );
    const stylesSizeGzip = superbytes(
      gzipSize.fileSync(path.join(publicDir, stylesName))
    );

    println(
      `  <green>+</green> ${stylesName} <dim>(${stylesSize} / ${stylesSizeGzip} gzipped)</dim>`
    );
  }

  fs.readdirSync(srcStaticDir).forEach((entry) => {
    const fullPath = path.join(srcStaticDir, entry);

    if (entry.endsWith(".mustache")) {
      const outPath = path.join(publicDir, path.basename(entry, ".mustache"));
      const template = fs.readFileSync(fullPath, "utf8");
      const rendered = mustache.render(template, context);

      fs.writeFileSync(outPath, rendered);

      const size = superbytes(Buffer.from(rendered).length);
      const gzipped = superbytes(gzipSize.sync(rendered));

      println(
        `    <green>+</green> ${path.basename(
          entry,
          ".mustache"
        )} <dim>(${size} / ${gzipped} gzipped)</dim>`
      );
    } else {
      const outPath = path.join(publicDir, entry);

      fs.copySync(fullPath, outPath);

      const size = superbytes(fs.statSync(outPath).size);
      const gzipped = superbytes(gzipSize.fileSync(outPath));

      println(
        `    <green>+</green> ${entry} <dim>(${size} / ${gzipped} gzipped)</dim>`
      );
    }
  });

  // Create server bundle (default server if no server dir is present)
  const serverEntry = path.join(config.path.server, "server.js");

  if (fs.existsSync(serverEntry)) {
    const serverBundle = await esbuild.build({
      entryPoints: [serverEntry],
      bundle: true,
      sourcemap: true,
      minify: true,
      target: "node12",
      platform: "node",
      outfile: path.join(buildDir, "server.js"),
    });
  } else {
    // Use default app server
    println(
      `<red><bold>ERROR</bold></red> No server found and default server is not yet implemented.`
    );
  }

  println("  <green>+</green> server.js");
  println("  <green>+</green> server.js.map");

  println(`\nBundled app in <green>${Date.now() - start}</green>ms\n`);
});
