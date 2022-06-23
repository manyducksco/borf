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

const defaultOptions = {
  bundle: true,
  watch,
  minify,
  target,
  allowOverwrite: true,
  sourcemap: true,
  platform: "browser",
};

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/index.js"],
    format: "esm",
    outfile: "dist/woof.client.m.js",
  })
  .then(() => {
    console.log("Created client bundle (module)");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/index.js"],
    format: "cjs",
    outfile: "dist/woof.client.c.js",
  })
  .then(() => {
    console.log("Created client bundle (common JS)");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/testing/index.js"],
    format: "esm",
    outfile: "dist/woof.client.testing.m.js",
  })
  .then(() => {
    console.log("Created testing bundle (module)");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/testing/index.js"],
    format: "cjs",
    outfile: "dist/woof.client.testing.c.js",
  })
  .then(() => {
    console.log("Created testing bundle (common JS)");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/helpers/index.js"],
    format: "esm",
    outfile: "dist/woof.client.helpers.m.js",
  })
  .then(() => {
    console.log("Created helpers bundle (module)");
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...defaultOptions,
    entryPoints: ["src/helpers/index.js"],
    format: "cjs",
    outfile: "dist/woof.client.helpers.c.js",
  })
  .then(() => {
    console.log("Created helpers bundle (common JS)");
  })
  .catch(() => process.exit(1));
