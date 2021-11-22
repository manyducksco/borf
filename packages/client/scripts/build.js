const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: "browser",
    format: "esm",
    outfile: "dist/woof.js",
  })
  .then(() => {
    console.log("Created ESM bundle");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: "node",
    format: "cjs",
    outfile: "dist/woof.node.js",
  })
  .then(() => {
    console.log("Created node bundle");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    entryPoints: ["src/testing/index.js"],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: "browser",
    format: "esm",
    outfile: "dist/woof.testing.js",
  })
  .then(() => {
    console.log("Created testing bundle");
  })
  .catch(() => process.exit(1));
