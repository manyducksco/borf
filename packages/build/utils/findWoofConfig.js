const fs = require("fs");
const path = require("path");
const process = require("process");

module.exports = function findWoofConfig(dir = process.cwd()) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === "woof.config.js") {
      return require(path.join(dir, file));
    }
  }

  const parentDir = path.resolve(dir, "..");

  if (dir !== parentDir) {
    return findWoofConfig(parentDir);
  }

  return null;
};
