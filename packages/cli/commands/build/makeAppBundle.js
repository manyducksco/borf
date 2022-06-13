const fs = require("fs-extra");
const path = require("path");
const esbuild = require("esbuild");
const mustache = require("mustache");

const postCSSPlugin = require("esbuild-plugin-postcss2");

module.exports = function makeAppBundle(config) {
  const buildDir = config.path.build;
  const publicDir = path.join(buildDir, "public");

  // Empty build directories if they contain files.
  fs.emptyDirSync(buildDir);
  fs.emptyDirSync(publicDir);

  let entryPoint;

  if (config.client?.entryPoint) {
    if (path.isAbsolute(config.client.entryPoint)) {
      entryPoint = config.client.entryPoint;
    } else {
      entryPoint = path.join(config.path.root, config.client.entryPoint);
    }
  } else if (fs.existsSync(path.join(config.path.client, "client.js"))) {
    entryPoint = path.join(config.path.client, "client.js");
  } else if (fs.existsSync(path.join(config.path.client, "client.jsx"))) {
    entryPoint = path.join(config.path.client, "client.jsx");
  } else if (fs.existsSync(path.join(config.path.client, "client.ts"))) {
    entryPoint = path.join(config.path.client, "client.ts");
  } else if (fs.existsSync(path.join(config.path.client, "client.tsx"))) {
    entryPoint = path.join(config.path.client, "client.tsx");
  }

  if (entryPoint == null) {
    let expected =
      "'client/client.js', 'client/client.jsx', 'client/client.ts' or 'client/client.tsx'";

    if (config.client?.entryPoint) {
      expected = config.client.entryPoint;
    }

    throw new Error(`No app entrypoint file found. Expected ${expected}`);
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
    loader: {
      ".js": "jsx",
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".svg": "file",
      ".webp": "file",
    },
    plugins: [
      postCSSPlugin.default({
        plugins: config.postcss?.plugins || [],
        modules: {
          generateScopedName: "[folder]_[local]_[contenthash:8]",
        },
      }),
    ],
    jsxFactory: "_jsx",
    jsxFragment: '"<>"',
    outbase: config.path.client,
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

    const staticDir = path.join(config.path.client, "static");
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
        } else if (fs.statSync(fullPath).isDirectory()) {
          const outPath = path.join(publicDir, entry);

          fs.copySync(fullPath, outPath, { recursive: true });
          writtenFiles.push({
            path: outPath,
            contents: null,
          });
        } else {
          const outPath = path.join(publicDir, entry);

          fs.copySync(fullPath, outPath, { recursive: true });
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
    /**
     * Build and write files to disk.
     */
    async build() {
      const bundle = await esbuild.build(esbuildConfig);

      const { writtenFiles } = writeBundle(bundle);

      bundle.writtenFiles = writtenFiles;

      return bundle;
    },

    /**
     * Build and write files, then return an object with a `.rebuild()` method to rebuild files changed since last build.
     */
    async buildIncremental() {
      const bundle = await esbuild.build({
        ...esbuildConfig,
        incremental: true,
      });

      return rebundle(bundle);
    },
  };
};
