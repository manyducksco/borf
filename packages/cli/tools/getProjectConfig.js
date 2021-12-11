const path = require("path");
const deepMerge = require("./deepMerge");

function getDefaultConfig(dir) {
  const root = path.resolve(dir);

  return {
    path: {
      root,
      get app() {
        return path.join(this.root, "app");
      },
      get server() {
        return path.join(this.root, "server");
      },
      get dist() {
        return path.join(this.root, "dist");
      },
      get temp() {
        return path.join(this.root, "temp");
      },
      get blueprints() {
        return path.join(this.root, "blueprints");
      },
      get components() {
        return path.join(this.app, "components");
      },
      get resources() {
        return path.join(this.server, "resources");
      },
      get services() {
        // TODO: Figure out conflict here with services being in both app and server.
        return path.join(this.app, "services");
      },
    },
  };
}

module.exports = function getProjectConfig(dir) {
  const configPath = path.join(dir, "woof.config.js");
  try {
    let config = require(configPath);

    if (typeof config !== "object" || Array.isArray(config)) {
      throw new TypeError(
        `Expected woof.config.js to export an object. Received: ${config}`
      );
    }

    config = deepMerge(getDefaultConfig(dir), config);

    for (const key in config.path) {
      if (!path.isAbsolute(config.path[key])) {
        config.path[key] = path.resolve(config.path[key]);
      }
    }

    return config;
  } catch (err) {
    console.log(err);
    return null;
  }
};
