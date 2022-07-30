const esbuild = require("esbuild");

const target = "es2018";
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
    allowOverwrite: true,
    sourcemap: true,
    format: "esm",
    outfile: "dist/woof.data.m.js",
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
    allowOverwrite: true,
    sourcemap: true,
    format: "cjs",
    outfile: "dist/woof.data.c.js",
  })
  .then(() => {
    console.log("Created CJS bundle");
  })
  .catch(() => process.exit(1));
