const fs = require("fs");
const path = require("path");
const process = require("process");

/**
 * Finds the nearest woof.config.js file in parent directories. This should be at the root of your project if one exists.
 */
module.exports = function findWoofConfig(dir = process.cwd()) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (/^woof\.config\.[cm]?js$/.test(file)) {
      return require(path.join(dir, file));
    }
  }

  const parentDir = path.resolve(dir, "..");

  if (dir !== parentDir) {
    return findWoofConfig(parentDir);
  }

  return null;
};
