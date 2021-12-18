const path = require("path");
const fs = require("fs");
const mustache = require("mustache");

const fileBlacklist = ["desktop.ini", ".DS_Store", ".gitkeep"];

module.exports = function loadBlueprint(entryPath, args, config) {
  const filesDir = path.join(path.dirname(entryPath), "files");

  const options = require(entryPath)(args, config);
  options.files = options.files || [];

  (function readFiles(dir, outDir) {
    fs.readdirSync(dir)
      .filter((file) => file[0] !== "." && !fileBlacklist.includes(file))
      .forEach((file) => {
        const srcFile = path.join(filesDir, file);
        const outFile = path.join(
          outDir,
          path.basename(replaceFileVars(file, options.variables), ".mustache")
        );

        if (fs.statSync(srcFile).isDirectory()) {
          readFiles(srcFile, path.join(outDir, srcFile));
        } else {
          options.files.push({
            path: outFile.replace(options.output, "").slice(1),
            create: () => {
              const template = fs.readFileSync(srcFile, "utf8");
              return mustache.render(template, options.variables);
            },
          });
        }
      });
  })(filesDir, options.output);

  return options;
};

function replaceFileVars(fileName, vars) {
  for (const v in vars) {
    fileName = fileName.replace(`[${v}]`, vars[v]);
  }

  return fileName;
}
