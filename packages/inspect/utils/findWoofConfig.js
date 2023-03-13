import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Finds the nearest builde.config.js file in parent directories. This should be at the root of your project if one exists.
 */
export default async function findWoofConfig(dir = process.cwd()) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (/^builde\.config\.[cm]?js$/.test(file)) {
      const module = await import(path.join(dir, file));

      if (module.default) {
        return module.default;
      }

      return module;
    }
  }

  const parentDir = path.resolve(dir, "..");

  if (dir !== parentDir) {
    return findWoofConfig(parentDir);
  }

  return null;
}
