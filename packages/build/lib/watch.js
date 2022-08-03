import { println } from "@ratwizard/cli";
import ip from "ip";
import fs from "fs-extra";
import path from "path";
import express from "express";
import expressProxy from "express-http-proxy";
import esbuild from "esbuild";
import chokidar from "chokidar";
import nodemon from "nodemon";
import getPort from "get-port";
import stylePlugin from "esbuild-style-plugin";
import EventEmitter from "events";
import esbuildConfig from "./utils/esbuildConfig.js";

import log from "./utils/log.js";
import { generateScopedClassName } from "./utils/generateScopedClassName.js";
import { writeClientFiles } from "./utils/writeClientFiles.js";
import { writeStaticFiles } from "./utils/writeStaticFiles.js";
import { makeTimer } from "./utils/timer.js";

export async function watch(projectRoot, buildOptions) {
  /**
   * 1. Watch server, client and static folders.
   * 2. Trigger esbuild on server when server files change.
   * 3. Trigger esbuild on client when client files change.
   * 4. Trigger build on static files when they change.
   */

  let woofConfig = {};

  try {
    woofConfig = (await import(path.join(projectRoot, "woof.config.js")))
      .default;
  } catch {}

  const clientEntryPath = getClientEntryPath(projectRoot, woofConfig);
  const serverEntryPath = getServerEntryPath(projectRoot, woofConfig);
  const staticPath = path.join(projectRoot, "static");
  const buildPath = path.join(projectRoot, "build");
  const buildStaticPath = path.join(buildPath, "static");

  // Emits build events.
  const events = new EventEmitter();

  await fs.emptyDir(buildPath);
  log.build("cleaned build folder");

  // Track which files exist for cleanup when builds are updated.
  const ctx = {
    clientFiles: [],
    serverFiles: [],
    staticFiles: [],
  };

  /*============================*\
  ||          /static           ||
  \*============================*/

  async function updateStaticFiles() {
    const end = makeTimer();

    for (const file of ctx.staticFiles) {
      fs.unlinkSync(file.path);
    }

    ctx.staticFiles = await writeStaticFiles({
      projectRoot,
      staticPath,
      buildPath,
      buildStaticPath,
      clientEntryPath,
      buildOptions,
    });

    const time = end();

    if (ctx.staticFiles.length > 0) {
      log.static("built in", "%c" + time);
    }
  }

  const staticWatcher = chokidar.watch([`${staticPath}/**/*`], {
    persistent: true,
    ignoreInitial: true,
  });

  staticWatcher.on("all", updateStaticFiles);
  events.on("client built", updateStaticFiles);

  await updateStaticFiles();

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

    async function updateClientFiles(clientBundle) {
      for (const file of ctx.clientFiles) {
        fs.unlinkSync(file.path);
      }

      ctx.clientFiles = await writeClientFiles({
        clientBundle,
        projectRoot,
        staticPath,
        buildStaticPath,
        clientEntryPath,
        buildOptions,
        isDevelopment: true,
      });
    }

    let clientBundle;

    async function buildClient() {
      const end = makeTimer();

      if (clientBundle) {
        try {
          const incremental = await clientBundle.rebuild();

          await updateClientFiles(incremental);
          events.emit("client built");

          log.client("rebuilt in", "%c" + end());
        } catch (err) {}
      } else {
        try {
          clientBundle = await esbuild.build({
            ...esbuildConfig,
            entryPoints: [clientEntryPath],
            entryNames: "[dir]/client.[hash]",
            outdir: buildStaticPath,
            minify: buildOptions.minify,
            plugins: [
              stylePlugin({
                postcss: {
                  plugins: woofConfig.client?.postcss?.plugins || [],
                },
                cssModulesOptions: {
                  generateScopedName: generateScopedClassName,
                },
              }),
            ],
            incremental: true,
          });

          await updateClientFiles(clientBundle);
          events.emit("client built");

          log.client("built in", "%c" + end());
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

  let serverPort;

  if (serverEntryPath) {
    const hold = ExposedPromise();

    const serverPath = path.dirname(serverEntryPath);
    serverPort = await getPort();

    nodemon({
      script: serverEntryPath,
      watch: [path.join(serverPath, "**", "*")],
      stdout: false,
      env: {
        PORT: serverPort,
      },
    })
      .on("start", () => {
        hold.resolve();
      })
      .on("stdout", (buffer) => {
        log.server(buffer.toString());
      })
      .on("stderr", (buffer) => {
        log.server("<red>ERROR:</red>", buffer.toString());
      })
      .on("quit", () => {
        log.server("server has quit");
      })
      .on("restart", () => {
        log.server("* restarted *");
      });

    // Wait until server starts to proceed.
    await hold;
  }

  /*============================*\
  ||        Proxy Server        ||
  \*============================*/

  const proxy = express();

  proxy.disable("x-powered-by");

  const proxyPort = await getPort({
    port: [4000, 4001, 4002, 4003, 4004, 4005],
  });

  if (clientEntryPath) {
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
  }

  if (serverPort != null) {
    proxy.use(expressProxy(`http://localhost:${serverPort}`));
  } else if (clientEntryPath) {
    proxy.use(express.static(path.join(buildPath, "static")));
    proxy.all("*", (req, res, next) => {
      if (req.method === "GET" && path.extname(req.path) === "") {
        res.sendFile(path.join(buildPath, "static", "index.html"));
      } else {
        next();
      }
    });
  }

  proxy.listen(proxyPort, () => {
    log.proxy(
      "app is running at",
      `%chttp://localhost:${proxyPort}`,
      "and",
      `%chttp://${ip.address()}:${proxyPort}`
    );
  });
}

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
      if (/^app.m?[jt]sx?$/.test(fileName)) {
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

/**
 * Create a promise with its resolve and reject functions available on the promise itself.
 */
function ExposedPromise() {
  let _resolve;
  let _reject;

  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  promise.resolve = _resolve;
  promise.reject = _reject;

  return promise;
}
