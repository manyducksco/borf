// 1. Get project root
// 2. Recurse to find all .view.* files
// 3. Build an index file importing all views and exposing an object on `window`

const fs = require("fs-extra");
const path = require("path");
const { build } = require("@woofjs/build");

const isIgnored = /node_modules|^\./;
const isView = /\.view\.[jt]sx?$/;

module.exports = async function buildViews(options, bundleConfig) {
  const frameRoot = path.join(__dirname, "../frame");
  const bundleSrcRoot = path.join(options.buildRoot, "src");
  const bundleRoot = path.join(options.buildRoot, "bundle");

  // Make sure build directory is empty and subdirectories exist.
  await fs.emptyDir(options.buildRoot);
  await fs.ensureDir(bundleSrcRoot);
  await fs.ensureDir(bundleRoot);

  const views = findViews(options.clientRoot);

  let index = "";
  let nextId = 0;

  // Hack CSS imports into frame index so they get included in the build.
  if (options.includeCSS && options.includeCSS.length > 0) {
    for (const file of options.includeCSS) {
      const fileName = path.basename(file);
      const absolutePath = path.resolve(file);
      const newPath = path.join(bundleSrcRoot, fileName);

      await fs.copyFile(absolutePath, newPath);

      index += `import "./${fileName}";\n`;
    }
  }

  // Add imports
  for (const view of views) {
    view.id = nextId++;
    index += `import View${view.id} from "${view.absolutePath}";\n`;
  }

  index += "export default [\n";

  for (const view of views) {
    index += `  { id: ${view.id}, absolutePath: "${view.absolutePath}", relativePath: "${view.relativePath}", componentName: "${view.componentName}", exports: View${view.id} },\n`;
  }

  index += "];\n";

  // Copy /files to /src
  await fs.copy(frameRoot, bundleSrcRoot);

  // Write views index file
  const outputPath = path.join(bundleSrcRoot, "views-index.js");
  await fs.writeFile(outputPath, index);

  const bundle = await build(
    {
      ...options,
      client: path.join(bundleSrcRoot, "views.js"),
      output: bundleRoot,
    },
    bundleConfig
  );

  return bundle;
};

function findViews(folder, root = null) {
  const contents = fs.readdirSync(folder);
  const views = [];

  if (root == null) {
    root = folder;
  }

  for (const name of contents) {
    if (!isIgnored.test(name)) {
      const fullPath = path.join(folder, name);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        views.push(...findViews(fullPath, root));
      } else if (isView.test(name)) {
        views.push({
          absolutePath: fullPath,
          relativePath: fullPath.replace(root, "").replace(/^\//, ""),
          componentName: getComponentName(name),
        });
      }
    }
  }

  return views;
}

function getComponentName(filePath) {
  return path.basename(filePath).replace(isView, "");
}
