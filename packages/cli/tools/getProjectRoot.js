const fs = require("fs");
const path = require("path");

/**
 * Returns the closest directory with a woof.config.js in it.
 */
module.exports = function getProjectRoot(dirname) {
  for (const item of fs.readdirSync(dirname)) {
    if (item === "woof.config.js") {
      return dirname;
    }
  }

  const parent = path.join(dirname, "..");

  if (parent != "/") {
    return getProjectRoot(parent);
  }
};
