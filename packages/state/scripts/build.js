const esbuild = require("esbuild");

const target = "es2017";
let minify = false;
let watch = false;

if (process.argv.includes("--minify")) {
  minify = true;
}

if (process.argv.includes("--watch")) {
  watch = {
    onRebuild(error, result) {
      if (error) {
        console.error("build failed", error);
      } else {
        console.log("build succeeded");
      }
    },
  };
}

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    watch,
    minify,
    target,
    sourcemap: true,
    platform: "browser",
    format: "esm",
    outfile: "dist/state.js",
  })
  .then(() => {
    console.log("Created ESM bundle");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    watch,
    minify,
    target,
    sourcemap: true,
    platform: "node",
    format: "cjs",
    outfile: "dist/state.node.js",
  })
  .then(() => {
    console.log("Created node bundle");
  })
  .catch(() => process.exit(1));