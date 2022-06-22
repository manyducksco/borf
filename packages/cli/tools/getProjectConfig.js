const fs = require("fs");
const path = require("path");
const deepMerge = require("./deepMerge");

function getDefaultConfig(dir) {
  const root = path.resolve(dir);

  return {
    path: {
      root,
      get client() {
        return path.join(this.root, "client");
      },
      get server() {
        return path.join(this.root, "server");
      },
      get build() {
        return path.join(this.root, "build");
      },
      get temp() {
        return path.join(this.root, "temp");
      },
      get blueprints() {
        return path.join(this.root, "blueprints");
      },
      get components() {
        return path.join(this.client, "components");
      },
      get services() {
        // TODO: Figure out conflict here with services being in both app and server.
        return path.join(this.client, "services");
      },
    },
  };
}

module.exports = function getProjectConfig(dir) {
  const configPath = path.join(dir, "woof.config.js");

  let config = getDefaultConfig(dir);

  if (fs.existsSync(configPath)) {
    try {
      let loaded = require(configPath);

      if (typeof loaded !== "object" || Array.isArray(loaded)) {
        throw new TypeError(
          `Expected woof.config.js to export an object. Received: ${loaded}`
        );
      }

      config = deepMerge(config, loaded);
    } catch (err) {
      return null;
    }
  }

  for (const key in config.path) {
    if (!path.isAbsolute(config.path[key])) {
      config.path[key] = path.resolve(config.path[key]);
    }
  }

  return config;
};
