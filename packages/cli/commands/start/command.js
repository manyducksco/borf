const { Command, println } = require("@ratwizard/cli");

module.exports = new Command().action(() => {
  const config = getProjectConfig(process.cwd());

  if (config == null) {
    return println(
      `<red><bold>ERROR</bold></red> No woof.config.js file found. This command must be run at the root of the project.`
    );
  }

  const chokidar = require("chokidar");
  const esbuild = require("esbuild");

  // TODO: Start dev server

  /**
   * - watch files in `app` and `server` paths
   * - when `app` files change, rebuild bundle and reload the browser
   * - when `server` files change, rebuild bundle and reload the server
   *
   * Server and app should run on the same process. Server should serve the app.
   */

  println("\n<bold><red>TODO</red></bold> Not yet implemented");
});
