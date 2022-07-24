const { println } = require("@ratwizard/cli");
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const esbuild = require("esbuild");
const chokidar = require("chokidar");
const xxhash = require("xxhashjs");
const cheerio = require("cheerio");
const htmlMinifier = require("html-minifier");
const stylePlugin = require("esbuild-style-plugin");
const { EventEmitter } = require("events");

module.exports = async function watch(projectRoot, buildOptions) {
  /**
   * 1. Watch server, client and static folders.
   * 2. Trigger esbuild on server when server files change.
   * 3. Trigger esbuild on client when client files change.
   * 4. Trigger build on static files when they change.
   */

  let woofConfig = {};

  try {
    woofConfig = require(path.join(projectRoot, "woof.config.js"));
  } catch {}

  const clientEntryPath = getClientEntryPath(projectRoot, woofConfig);
  const serverEntryPath = getServerEntryPath(projectRoot, woofConfig);
  const staticPath = path.join(projectRoot, "static");
  const buildPath = path.join(projectRoot, "build");
  const buildStaticPath = path.join(buildPath, "static");

  // Emits build events.
  const events = new EventEmitter();

  const esbuildConfigBase = {
    // entryPoints: [config.entryPath],
    // entryNames: "[dir]/[name].[hash]",
    bundle: true,
    sourcemap: true,
    minify: buildOptions.minify,
    write: false,
    target: "es2018",
    format: "iife",
    loader: {
      ".js": "jsx",
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".svg": "file",
      ".webp": "file",
      ".ttf": "file",
      ".otf": "file",
      ".woff": "file",
      ".woff2": "file",
    },
    jsxFactory: "_jsx",
    jsxFragment: '"<>"',
  };

  await fs.emptyDir(buildPath);
  println(`<blue>[build]</blue> cleaned build folder`);

  // Track which files exist for cleanup when builds are updated.
  const ctx = {
    clientFiles: [],
    serverFiles: [],
    staticFiles: [],
  };

  /*============================*\
  ||          /static           ||
  \*============================*/

  function updateStaticFiles() {
    if (fs.existsSync(staticPath)) {
      for (const file of ctx.staticFiles) {
        fs.unlinkSync(file.path);
      }

      const copiedFiles = [];

      fs.copySync(staticPath, path.join(buildPath, "static"), {
        filter: (src, dest) => {
          if (src.replace(staticPath, "") === "/index.html") {
            return false; // Skip index.html which is handled by client build
          }

          // Wooooo side effects
          if (src !== staticPath) {
            copiedFiles.push({ path: dest });
          }

          return true;
        },
      });

      for (const file of copiedFiles) {
        println(
          `<magenta>[static]</magenta> copied ${file.path.replace(
            projectRoot,
            ""
          )}`
        );
      }

      ctx.staticFiles = copiedFiles;
    }
  }

  const staticWatcher = chokidar.watch([`${staticPath}/**/*`], {
    persistent: true,
    ignoreInitial: true,
  });

  staticWatcher.on("all", updateStaticFiles);
  events.on("client built", updateStaticFiles);
  events.on("server built", updateStaticFiles);

  /*============================*\
  ||          /client           ||
  \*============================*/

  if (clientEntryPath) {
    const clientPath = path.dirname(clientEntryPath);

    const clientWatcher = chokidar.watch(
      [`${clientPath}/**/*`, `${staticPath}/index.html`],
      {
        persistent: true,
        ignoreInitial: true,
      }
    );

    function updateClientFiles(files) {
      // Delete old files.
      for (const file of ctx.clientFiles) {
        fs.unlinkSync(file.path);
      }

      const writtenFiles = [];

      // Write new ones.
      for (const file of files) {
        let filePath;

        if (/\.css(\.map)?$/.test(file.path)) {
          filePath = file.path.replace(
            buildStaticPath,
            path.join(buildStaticPath, "css")
          );
        } else if (/\.js(\.map)?$/.test(file.path)) {
          filePath = file.path.replace(
            buildStaticPath,
            path.join(buildStaticPath, "js")
          );
        }

        fs.mkdirpSync(path.dirname(filePath));
        fs.writeFileSync(filePath, file.contents);
        println(
          `<green>[client]</green> wrote ${filePath.replace(projectRoot, "")}`
        );

        writtenFiles.push({
          ...file,
          path: filePath,
        });
      }

      // Write index.html
      try {
        const index = fs.readFileSync(path.join(staticPath, "index.html"));
        const $ = cheerio.load(index);

        const styles = writtenFiles.filter(
          (file) => path.extname(file.path) === ".css"
        );
        const scripts = writtenFiles.filter(
          (file) => path.extname(file.path) === ".js"
        );

        // Add styles to head.
        for (const file of styles) {
          let href = file.path.replace(buildStaticPath, "");

          if (buildOptions.relativeBundlePaths) {
            href = "." + href;
          }

          $("head").append(`<link rel="stylesheet" href="${href}">`);
        }

        // Add bundle reload listener to head.
        $("head").append(`
          <script>
            const events = new EventSource("/_bundle");

            events.addEventListener("message", (message) => {
              window.location.reload();
            });

            window.addEventListener("beforeunload", () => {
              events.close();
            });
          </script>
        `);

        // Add scripts to body.
        for (const file of scripts) {
          let src = file.path.replace(buildStaticPath, "");

          if (buildOptions.relativeBundlePaths) {
            src = "." + src;
          }

          $("body").append(`<script src="${src}"></script>`);
        }

        let html = $.html();

        if (buildOptions.minify) {
          html = htmlMinifier.minify(html, {
            collapseWhitespace: true,
            conservativeCollapse: false,
            preserveLineBreaks: false,
            removeScriptTypeAttributes: true,
            minifyCSS: true,
            minifyJS: true,
          });
        }

        fs.writeFileSync(path.join(buildStaticPath, "index.html"), html);

        println(
          `<green>[client]</green> wrote ${path
            .join(buildStaticPath, "index.html")
            .replace(projectRoot, "")}`
        );

        writtenFiles.push({
          path: path.join(buildStaticPath, "index.html"),
        });
      } catch (err) {
        if (err.code === "ENOENT") {
          if (clientEntryPath) {
            println(
              `<red>[ERROR]</red> /static/index.html file not found. Please create one to serve as the entry point for your client app.`
            );
          }
        } else {
          println(`<red>[ERROR]</red> ${err.message}`);
        }
      }

      // Update references.
      ctx.clientFiles = writtenFiles;
    }

    let clientBundle;

    async function buildClient() {
      const start = Date.now();

      if (clientBundle) {
        try {
          const incremental = await clientBundle.rebuild();

          updateClientFiles(incremental.outputFiles);
          events.emit("client built");

          println(
            `<green>[client]</green> rebuilt in <green>${
              Date.now() - start
            }ms</green>`
          );
        } catch (err) {}
      } else {
        try {
          clientBundle = await esbuild.build({
            ...esbuildConfigBase,
            entryPoints: [clientEntryPath],
            entryNames: "[dir]/client.[hash]",
            outdir: buildStaticPath,
            inject: [path.join(__dirname, "../utils/jsx-shim-client.js")],
            plugins: [
              stylePlugin({
                postcss: {
                  plugins: woofConfig.client?.postcss?.plugins || [],
                },
                cssModulesOptions: {
                  generateScopedName: function (name, filename, css) {
                    const file = path.basename(filename, ".module.css");
                    const hash = xxhash
                      .h64()
                      .update(css)
                      .digest()
                      .toString(16)
                      .slice(0, 5);

                    return file + "_" + name + "_" + hash;
                  },
                },
              }),
            ],
            incremental: true,
          });

          updateClientFiles(clientBundle.outputFiles);
          events.emit("client built");

          println(
            `<green>[client]</green> built in <green>${
              Date.now() - start
            }ms</green>`
          );
        } catch (err) {
          console.error(err);
        }
      }
    }

    const triggerBuild = makeTimeoutTrigger(buildClient, 100);

    clientWatcher.on("all", triggerBuild);

    await buildClient();
  }

  /*============================*\
  ||          /server           ||
  \*============================*/

  if (serverEntryPath) {
    const serverPath = path.dirname(serverEntryPath);

    const serverWatcher = chokidar.watch([`${serverPath}/**/*`], {
      persistent: true,
      ignoreInitial: true,
    });

    function updateServerFiles(files) {
      // Delete old files.
      for (const file of ctx.serverFiles) {
        fs.unlinkSync(file.path);
      }

      const writtenFiles = [];

      // Write new ones.
      for (const file of files) {
        const fileName = path.basename(file.path);

        // Server entry point gets written as server.js
        if (/^server\.(.+?)\.js(\.map)?$/.test(fileName)) {
          const filePath = path.join(
            buildPath,
            fileName.replace(/^server(.+?)\.js/, function (sub, match) {
              return sub.replace(match, "");
            })
          );

          writtenFiles.push({
            ...file,
            path: filePath,
            entry: true,
          });

          fs.mkdirpSync(path.dirname(filePath));
          fs.writeFileSync(filePath, file.contents);
          println(
            `<cyan>[server]</cyan> wrote ${filePath.replace(projectRoot, "")}`
          );
        } else {
          // Everything else goes in /build/static
          let filePath;

          if (/\.css(\.map)?$/.test(file.path)) {
            filePath = file.path.replace(
              buildPath,
              path.join(buildStaticPath, "css")
            );
          } else if (/\.js(\.map)?$/.test(file.path)) {
            filePath = file.path.replace(
              buildPath,
              path.join(buildStaticPath, "js")
            );
          }

          writtenFiles.push({
            ...file,
            path: filePath,
          });

          fs.mkdirpSync(path.dirname(filePath));
          fs.writeFileSync(filePath, file.contents);
          println(
            `<cyan>[server]</cyan> wrote ${filePath.replace(projectRoot, "")}`
          );
        }
      }

      const manifestPath = path.join(buildPath, "static.json");
      const manifest = {
        entry: null,
        styles: [],
      };

      for (const file of writtenFiles) {
        if (file.entry) {
          manifest.entry = path.basename(file.path);
        } else if (path.extname(file.path) === ".css") {
          let filePath = file.path.replace(path.join(buildPath, "static"), "");

          if (!filePath.startsWith("/")) {
            filePath = "/" + filePath;
          }

          manifest.styles.push(filePath);
        }
      }

      writtenFiles.push({
        path: manifestPath,
      });

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // Update references.
      ctx.serverFiles = writtenFiles;
    }

    let serverBundle;

    async function buildServer() {
      const start = Date.now();

      if (serverBundle) {
        try {
          const incremental = await serverBundle.rebuild();

          updateServerFiles(incremental.outputFiles);
          events.emit("server built");

          println(
            `<cyan>[server]</cyan> rebuilt in <cyan>${
              Date.now() - start
            }ms</cyan>`
          );
        } catch (err) {
          console.log(err);
        }
      } else {
        try {
          serverBundle = await esbuild.build({
            ...esbuildConfigBase,
            entryPoints: [serverEntryPath],
            entryNames: "[dir]/server.[hash]",
            outdir: buildPath,
            platform: "node",
            inject: [path.join(__dirname, "../utils/jsx-shim-server.js")],
            plugins: [
              stylePlugin({
                postcss: {
                  plugins: woofConfig.server?.postcss?.plugins || [],
                },
                cssModulesOptions: {
                  generateScopedName: function (name, filename, css) {
                    const file = path.basename(filename, ".module.css");
                    const hash = xxhash
                      .h64()
                      .update(css)
                      .digest()
                      .toString(16)
                      .slice(0, 5);

                    return file + "_" + name + "_" + hash;
                  },
                },
              }),
            ],
            incremental: true,
          });

          updateServerFiles(serverBundle.outputFiles);
          events.emit("server built");

          println(
            `<cyan>[server]</cyan> built in <cyan>${
              Date.now() - start
            }ms</cyan>`
          );
        } catch (err) {
          console.log(err);
        }
      }
    }

    const triggerBuild = makeTimeoutTrigger(buildServer, 100);

    serverWatcher.on("all", triggerBuild);

    await buildServer();
  }

  /*============================*\
  ||        Proxy Server        ||
  \*============================*/

  const proxy = express();

  proxy.use(express.static(path.join(buildPath, "static")));

  const getPort = (await import("get-port")).default;
  const proxyPort = await getPort({
    port: [4000, 4001, 4002, 4003, 4004, 4005],
  });

  proxy.listen(proxyPort, () => {
    println(
      `\nVisit <yellow>http://localhost:${proxyPort}</yellow> in a browser to see app.`
    );

    println(
      `\n<yellow>[proxy]</yellow> app will auto reload when files are saved`
    );
  });

  // Client bundle listens for and is notified of rebuilds using Server Sent Events.
  proxy.get("/_bundle", (req, res) => {
    res.set({
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write("retry: 10000\n\n");

    const update = () => {
      res.write(`data: ${Math.round(Math.random() * 9999999)}\n\n`);
    };

    events.on("client built", update);

    res.on("close", () => {
      events.off("client built", update);
      res.end();
    });
  });

  proxy.all("*", (req, res, next) => {
    // TODO: Proxy requests with relative URLs to the server if one exists.

    if (req.method === "GET" && path.extname(req.path) === "") {
      res.sendFile(path.join(buildPath, "static", "index.html"));
    } else {
      next();
    }
  });
};

/**
 * Returns a function that either runs the callback, or, if the callback is currently running,
 * queues the callback to run again as soon as it is finished.
 */
function makeTimeoutTrigger(callback, timeout) {
  let timer = null;
  let queued = false;
  let running = false;

  async function run() {
    running = true;

    clearTimeout(timer);
    timer = null;

    await callback();

    running = false;

    if (queued) {
      queued = false;
      timer = setTimeout(run, timeout);
    }
  }

  return function trigger() {
    if (running) {
      queued = true;
    } else if (timer == null) {
      timer = setTimeout(run, timeout);
    }
  };
}

function getClientEntryPath(projectRoot, woofConfig) {
  // Use custom entry path from woof config if provided.
  // if (woofConfig.client?.entryPath) {
  //   return path.resolve(projectRoot, woofConfig.client.entryPath);
  // }

  const clientFolder = path.join(projectRoot, "client");

  if (fs.existsSync(clientFolder)) {
    for (const fileName of fs.readdirSync(clientFolder)) {
      if (/^app.[jt]sx?$/.test(fileName)) {
        return path.join(clientFolder, fileName);
      }
    }
  }
}

function getServerEntryPath(projectRoot, woofConfig) {
  // Use custom entry path from woof config if provided.
  // if (woofConfig.server?.entryPath) {
  //   return path.resolve(projectRoot, woofConfig.server.entryPath);
  // }

  const serverFolder = path.join(projectRoot, "server");

  if (fs.existsSync(serverFolder)) {
    for (const fileName of fs.readdirSync(serverFolder)) {
      if (/^app.[jt]sx?$/.test(fileName)) {
        return path.join(serverFolder, fileName);
      }
    }
  }
}

function esBuildPrint(result) {
  for (const error of result.errors) {
    println(`<red>[ERROR]</red> ${error.text}`);
    println(`<grey>${error.location.line}</grey>  ${error.location.lineText}`);

    let indent = "";

    for (
      let i = 0;
      i < String(error.location.line).length + 2 + error.location.column;
      i++
    ) {
      indent += " ";
    }

    println(`${indent}<red>^</red>`);
  }

  for (const warning of result.warnings) {
    println(`<yellow>[WARNING]</yellow> ${warning.text}`);
    println(
      `<grey>${warning.location.line}</grey>  ${warning.location.lineText}`
    );

    let indent = "";

    for (
      let i = 0;
      i < String(warning.location.line).length + 2 + warning.location.column;
      i++
    ) {
      indent += " ";
    }

    println(`${indent}<yellow>^</yellow>`);
  }
}
