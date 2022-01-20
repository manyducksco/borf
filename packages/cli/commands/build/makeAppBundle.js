const fs = require("fs-extra");
const path = require("path");
const esbuild = require("esbuild");
const mustache = require("mustache");

const postCSSPlugin = require("esbuild-plugin-postcss2");

console.log(postCSSPlugin);

module.exports = function makeAppBundle(config) {
  const buildDir = config.path.build;
  const publicDir = path.join(buildDir, "public");

  // Empty build directories if they contain files.
  fs.emptyDirSync(buildDir);
  fs.emptyDirSync(publicDir);

  let entryPoint;

  if (fs.existsSync(path.join(config.path.app, "app.js"))) {
    entryPoint = path.join(config.path.app, "app.js");
  } else if (fs.existsSync(path.join(config.path.app, "app.jsx"))) {
    entryPoint = path.join(config.path.app, "app.jsx");
  } else if (fs.existsSync(path.join(config.path.app, "app.ts"))) {
    entryPoint = path.join(config.path.app, "app.ts");
  } else if (fs.existsSync(path.join(config.path.app, "app.tsx"))) {
    entryPoint = path.join(config.path.app, "app.tsx");
  }

  if (entryPoint == null) {
    throw new Error(
      `No app entrypoint file found. Expected 'app/app.js', 'app/app.jsx', 'app/app.ts' or 'app/app.tsx'`
    );
  }

  const esbuildConfig = {
    entryPoints: [entryPoint],
    entryNames: "[dir]/[name].[hash]",
    bundle: true,
    sourcemap: true,
    minify: true,
    write: false,
    target: "es2018",
    format: "iife",
    loader: { ".js": "jsx" },
    plugins: [
      postCSSPlugin.default({
        plugins: [require("autoprefixer")],
        modules: {
          generateScopedName: "[folder]__[local]__[contenthash:8]",
        },
      }),
    ],
    jsxFactory: "$", // compile JSX to dolla
    jsxFragment: '""', // pass empty string for fragments
    outbase: config.path.app,
    outdir: publicDir,
  };

  // Overwrite any of these options with an `esbuild` object in woof.config.js
  if (config.esbuild) {
    for (const key in config.esbuild) {
      esbuildConfig[key] = config.esbuild[key];
    }
  }

  function writeBundle(bundle) {
    const writtenFiles = [];

    // Copy public dir files (transforming .mustache)

    const bundleOut = bundle.outputFiles.find(
      (f) => path.extname(f.path) === ".js"
    );
    const stylesOut = bundle.outputFiles.find(
      (f) => path.extname(f.path) === ".css"
    );

    const staticDir = path.join(config.path.app, "static");
    const bundlePath = bundleOut.path.replace(publicDir, "");
    const stylesPath = stylesOut ? stylesOut.path.replace(publicDir, "") : null;

    const context = {
      scripts: `<script src="${bundlePath}"></script>`,
      styles: stylesPath
        ? `<link rel="stylesheet" href="${stylesPath}">`
        : null,
      config,
    };

    if (config["static"]?.["injectScripts"]) {
      context.scripts += config["static"]["injectScripts"].join("");
    }

    for (const file of bundle.outputFiles) {
      fs.writeFileSync(file.path, file.contents);
      writtenFiles.push(file);
    }

    if (fs.statSync(staticDir).isDirectory()) {
      fs.readdirSync(staticDir).forEach((entry) => {
        const fullPath = path.join(staticDir, entry);

        if (entry.endsWith(".mustache")) {
          const name = path.basename(entry, ".mustache");
          const outPath = path.join(publicDir, name);
          const template = fs.readFileSync(fullPath, "utf8");
          const rendered = mustache.render(template, context);

          fs.writeFileSync(outPath, rendered);
          writtenFiles.push({
            path: outPath,
            contents: rendered,
          });
        } else {
          const outPath = path.join(publicDir, entry);

          fs.copySync(fullPath, outPath);
          writtenFiles.push({
            path: outPath,
            contents: fs.readFileSync(outPath),
          });
        }
      });
    }

    return {
      writtenFiles,
    };
  }

  async function rebundle(bundle) {
    const { writtenFiles } = writeBundle(bundle);

    return {
      ...bundle,
      writtenFiles,
      async rebuild() {
        const rebundled = await bundle.rebuild();
        return rebundle(rebundled);
      },
    };
  }

  return {
    async build() {
      const bundle = await esbuild.build(esbuildConfig);

      const { writtenFiles } = writeBundle(bundle);

      bundle.writtenFiles = writtenFiles;

      return bundle;
    },
    async buildIncremental() {
      const bundle = await esbuild.build({
        ...esbuildConfig,
        incremental: true,
      });

      return rebundle(bundle);
    },
  };
};
