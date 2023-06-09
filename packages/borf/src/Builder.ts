import type { BuildOptions, BuildResult } from "esbuild";

import path from "node:path";
import EventEmitter from "node:events";
import http from "node:http";
import fs from "fs-extra";
import pako from "pako";
import superbytes from "superbytes";
import cheerio from "cheerio";
import htmlMinifier from "html-minifier";
import imagemin from "imagemin";
import imageminPngquant from "imagemin-pngquant";
import imageminJpegtran from "imagemin-jpegtran";
import imageminSvgo from "imagemin-svgo";
import esbuild from "esbuild";
import stylePlugin from "esbuild-style-plugin";
import ip from "ip";
import httpProxy from "http-proxy";
import send from "send";
import chokidar from "chokidar";
import nodemon from "nodemon";
import getPort from "get-port";

import log from "./log.js";
import { Timer } from "./Timer.js";
import { makeConfig } from "./esbuildConfig.js";
import { generateScopedClassName } from "./generateScopedClassName.js";
import { makeTimeoutTrigger } from "./makeTimeoutTrigger.js";
import { makeExposedPromise } from "./makeExposedPromise.js";

/**
 * Config object with options that determine how an app is built.
 */
export interface BuilderConfig {
  /**
   * Options for the browser bundle.
   */
  browser?: {
    /**
     * Path to the main entry point file of your browser app.
     */
    entry: string;

    /**
     * Path to the browser app's index.html file. This is the file the browser requests when a user visits your app.
     * Links to bundled files are added as part of the build step.
     *
     * Defaults to `index.html` in your static path (`/static` by default).
     */
    index?: string; // TODO: Or should index.html be the app entry point, vite style?

    /**
     * Options passed directly to esbuild.
     */
    esbuild?: BuildOptions;

    /**
     * Options for PostCSS, which runs as part of the build.
     */
    postcss?: any; // TODO: Obtain proper types
  };

  /**
   * Options for the server bundle.
   */
  server?: {
    /**
     * Path to the main entry point file of your server app.
     */
    entry: string;
  };

  static?: {
    path: string;
  };

  output?: {
    path: string;

    /**
     * Strips and minimizes assets during build to reduce bundle size.
     * Highly recommended for production builds. Defaults to "production".
     */
    minify?: boolean | "production";

    /**
     * Compresses assets during build to reduce bandwidth required to load the app.
     * Highly recommended for production builds and works out of the box when served by @borf/server.
     * Defaults to "production".
     */
    compress?: boolean | "production";
  };
}

export class Builder {
  static configure(config: BuilderConfig) {
    // This function exists to provide autocomplete for config objects.
    return config;
  }

  #projectRoot: string;
  #config: BuilderConfig;

  #browserEntryPath?: string;
  #serverEntryPath?: string;
  #staticPath: string;
  #outputPath: string;

  get config() {
    return this.#config;
  }

  constructor(projectRoot: string, config: BuilderConfig) {
    this.#projectRoot = projectRoot;
    this.#config = config;

    if (config.browser) {
      this.#browserEntryPath = path.join(projectRoot, config.browser.entry);
    }

    if (config.server) {
      this.#serverEntryPath = path.join(projectRoot, config.server.entry);
    }

    if (config.static) {
      this.#staticPath = path.join(projectRoot, config.static.path);
    } else {
      this.#staticPath = path.join(projectRoot, "static");
    }

    if (config.output) {
      this.#outputPath = path.join(projectRoot, config.output.path);
    } else {
      this.#outputPath = path.join(projectRoot, "output");
    }
  }

  /**
   * Builds the app with the provided options.
   */
  async build() {
    await this.clean();

    const isProduction = process.env.NODE_ENV === "production";
    const outputConfig = Object.assign(
      {
        minify: "production",
        compress: "production",
      },
      this.#config.output
    );

    const buildOptions = {
      minify:
        outputConfig.minify === "production"
          ? isProduction
          : outputConfig.minify,
      compress:
        outputConfig.compress === "production"
          ? isProduction
          : outputConfig.compress,
    };

    /*============================*\
    ||          /client           ||
    \*============================*/

    if (this.#browserEntryPath) {
      const timer = new Timer();
      const browserConfig = this.#config.browser!;

      const ctx = await esbuild.context(
        makeConfig({
          entryPoints: [this.#browserEntryPath],
          entryNames: "[dir]/client.[hash]",
          outdir: path.join(this.#outputPath, "static"),
          minify: buildOptions.minify,
          plugins: [
            stylePlugin({
              postcss: {
                plugins: browserConfig.postcss?.plugins || [],
              },
              cssModulesOptions: {
                generateScopedName: generateScopedClassName,
              },
            }),
          ],
        })
      );

      const clientBundle = await ctx.rebuild();

      await writeClientFiles({
        clientBundle,
        projectRoot: this.#projectRoot,
        staticPath: this.#staticPath,
        buildStaticPath: path.join(this.#outputPath, "static"),
        clientEntryPath: this.#browserEntryPath,
        buildOptions,
      });

      log.client("built in", "%c" + timer.formatted);

      ctx.dispose();
    }

    /*============================*\
    ||          /static           ||
    \*============================*/

    const end = new Timer();

    const staticFiles = await writeStaticFiles({
      projectRoot: this.#projectRoot,
      buildPath: this.#outputPath,
      staticPath: this.#staticPath,
      buildStaticPath: path.join(this.#outputPath, "static"),
      clientEntryPath: this.#browserEntryPath!,
      buildOptions,
    });

    if (staticFiles.length > 0) {
      log.static("built in", "%c" + end.formatted);
    }
  }

  /**
   *
   */
  async watch() {
    await this.clean();

    const isProduction = process.env.NODE_ENV === "production";
    const outputConfig = Object.assign(
      {
        minify: "production",
        compress: "production",
      },
      this.#config.output
    );

    const buildOptions = {
      minify:
        outputConfig.minify === "production"
          ? isProduction
          : outputConfig.minify,
      compress:
        outputConfig.compress === "production"
          ? isProduction
          : outputConfig.compress,
    };

    // Emits build events.
    const events = new EventEmitter();

    // Track which files exist for cleanup when builds are updated.
    const ctx: Record<string, CopiedFile[]> = {
      clientFiles: [],
      serverFiles: [],
      staticFiles: [],
    };

    /*============================*\
    ||           Static           ||
    \*============================*/

    const updateStaticFiles = async () => {
      const end = new Timer();

      for (const file of ctx.staticFiles) {
        try {
          fs.unlinkSync(file.path);
        } catch (err: any) {
          log.static("<red>" + err.code + ":</red>", err.message);
        }
      }

      ctx.staticFiles = await writeStaticFiles({
        projectRoot: this.#projectRoot,
        staticPath: this.#staticPath,
        buildPath: this.#outputPath,
        buildStaticPath: path.join(this.#outputPath, "static"),
        clientEntryPath: this.#browserEntryPath!,
        buildOptions,
      });

      if (ctx.staticFiles.length > 0) {
        log.static("built in", "%c" + end.formatted);
      }
    };

    const staticWatcher = chokidar.watch([`${this.#staticPath}/**/*`], {
      persistent: true,
      ignoreInitial: true,
    });

    staticWatcher.on("all", updateStaticFiles);
    events.on("client built", updateStaticFiles);

    if (this.#browserEntryPath == null) {
      await updateStaticFiles();
    }

    /*============================*\
    ||          Browser           ||
    \*============================*/

    if (this.#browserEntryPath) {
      const clientPath = path.dirname(this.#browserEntryPath);

      const clientWatcher = chokidar.watch(
        [`${clientPath}/**/*`, `${this.#staticPath}/index.html`],
        {
          persistent: true,
          ignoreInitial: true,
        }
      );

      const updateClientFiles = async (clientBundle: BuildResult) => {
        for (const file of ctx.clientFiles) {
          fs.unlinkSync(file.path);
        }

        ctx.clientFiles = await writeClientFiles({
          clientBundle,
          projectRoot: this.#projectRoot,
          staticPath: this.#staticPath,
          buildStaticPath: path.join(this.#outputPath, "static"),
          clientEntryPath: this.#browserEntryPath!,
          buildOptions,
          isDevelopment: !isProduction,
        });
      };

      const buildContext = await esbuild.context(
        makeConfig({
          entryPoints: [this.#browserEntryPath!],
          entryNames: "[dir]/client.[hash]",
          outdir: path.join(this.#outputPath, "static"),
          minify: buildOptions.minify,
          plugins: [
            stylePlugin({
              postcss: {
                plugins: this.#config.browser?.postcss?.plugins || [],
              },
              cssModulesOptions: {
                generateScopedName: generateScopedClassName,
              },
            }),
          ],
        })
      );

      const buildClient = async () => {
        const end = new Timer();

        try {
          const incremental = await buildContext.rebuild();

          await updateClientFiles(incremental);
          events.emit("client built");

          log.client("rebuilt in", "%c" + end.formatted);
        } catch (err) {
          // console.error(err);
        }
      };

      const triggerBuild = makeTimeoutTrigger(buildClient, 200);

      clientWatcher.on("all", triggerBuild);

      await buildClient();
    }

    /*============================*\
    ||           Server           ||
    \*============================*/

    let serverPort;

    if (this.#serverEntryPath) {
      const hold = makeExposedPromise<void>();

      const serverPath = path.dirname(this.#serverEntryPath);
      serverPort = await getPort();

      nodemon({
        script: this.#serverEntryPath,
        watch: [path.join(serverPath, "**", "*")],
        stdout: false,
        env: {
          PORT: serverPort,
          NODE_ENV: "development",
        },
      })
        .on("start", () => {
          setTimeout(() => {
            hold.resolve();
          }, 200);
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

    const proxy =
      serverPort != null
        ? httpProxy.createProxyServer({
            target: {
              host: "localhost",
              port: serverPort,
            },
          })
        : null;

    const devProxy = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === "/_bundle") {
        res.writeHead(200, {
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream",
          Connection: "keep-alive",
        });

        res.write(`retry: ${10000}\n\n`);

        const update = () => {
          res.write("data: time to reload\n\n");
        };

        events.on("client built", update);

        res.on("close", () => {
          events.off("client built", update);
        });
      } else if (proxy) {
        proxy.web(req, res);
      } else if (this.#browserEntryPath) {
        // Serve static files for client-only apps.
        const stream = send(req, req.url!, {
          root: path.join(this.#outputPath, "static"),
          maxAge: 0,
        });

        stream.on("error", function onError(err) {
          res.writeHead(err.status);
          res.end();
        });

        stream.pipe(res);
      }
    });

    devProxy.on("error", (err) => {
      console.error(err);
    });

    if (proxy) {
      devProxy.on("upgrade", (req, socket, head) => {
        proxy.ws(req, socket, head);
      });
    }

    const devServerPort = await getPort({
      port: [4000, 4001, 4002, 4003, 4004, 4005],
    });

    devProxy.listen(devServerPort, () => {
      log.proxy(
        "app is running at",
        `%chttp://localhost:${devServerPort}`,
        "and",
        `%chttp://${ip.address()}:${devServerPort}`
      );
    });
  }

  /**
   * Ensures that output directories exist and removes any existing files.
   */
  async clean() {
    await fs.emptyDir(this.#outputPath);
    log.build("cleaned build folder");
  }
}

interface WriteClientFilesOptions {
  clientBundle: BuildResult;
  projectRoot: string;
  staticPath: string;
  buildStaticPath: string;
  clientEntryPath: string;
  buildOptions: {
    compress?: boolean;
    minify?: boolean;
    relativeBundlePaths?: boolean;
  };
  isDevelopment?: boolean;
}

export async function writeClientFiles({
  clientBundle,
  projectRoot,
  staticPath,
  buildStaticPath,
  clientEntryPath,
  buildOptions,
  isDevelopment = false,
}: WriteClientFilesOptions) {
  const writtenFiles = [];

  for (const file of clientBundle.outputFiles!) {
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
    } else {
      filePath = file.path;
    }

    fs.mkdirpSync(path.dirname(filePath));

    if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
      fs.writeFileSync(filePath, file.contents);

      const size = superbytes(file.contents.length);
      log.client("wrote", filePath.replace(projectRoot, ""), `%c(${size})`);

      if (buildOptions.compress) {
        const writePath = filePath + ".gz";
        const contents = pako.gzip(file.contents, {
          level: 9,
        });
        fs.writeFileSync(writePath, contents);

        const size = superbytes(contents.length);
        log.client("wrote", writePath.replace(projectRoot, ""), `%c(${size})`);
      }
    } else {
      fs.writeFileSync(filePath, file.contents);

      log.client("wrote", filePath.replace(projectRoot, ""));
    }

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
    if (isDevelopment) {
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
    }

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

    log.client(
      "wrote",
      path.join(buildStaticPath, "index.html").replace(projectRoot, "")
    );

    writtenFiles.push({
      path: path.join(buildStaticPath, "index.html"),
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      if (clientEntryPath) {
        log.client(
          "<red>ERROR:</red>",
          "/static/index.html file not found. Please create one to serve as the entry point for your client app."
        );
      }
    } else {
      log.client("<red>ERROR:</red>", err.message);
    }
  }

  return writtenFiles;
}

interface WriteStaticFilesOptions {
  projectRoot: string;
  staticPath: string;
  buildPath: string;
  buildStaticPath: string;
  clientEntryPath: string;
  buildOptions: {
    compress?: boolean;
  };
}

interface CompressableFile {
  type: "gzip" | "imagemin";
  src: string;
  dest: string;
}

interface CopiedFile {
  path: string;
}

export async function writeStaticFiles({
  projectRoot,
  staticPath,
  buildPath,
  buildStaticPath,
  clientEntryPath,
  buildOptions,
}: WriteStaticFilesOptions) {
  const writtenFiles = [];

  if (fs.existsSync(staticPath)) {
    const copiedFiles: CopiedFile[] = [];
    const compressableFiles: CompressableFile[] = [];
    const imageTypes = ["jpg", "jpeg", "png", "svg"];

    fs.copySync(staticPath, path.join(buildPath, "static"), {
      filter: (src, dest) => {
        if (clientEntryPath && src.replace(staticPath, "") === "/index.html") {
          return false; // Skip index.html which is handled by client build
        }

        if (buildOptions.compress) {
          const ext = path.extname(src).slice(1).toLowerCase();

          if (ext === "css" || ext === "js") {
            compressableFiles.push({ type: "gzip", src, dest });
            return false;
          }

          if (imageTypes.includes(ext)) {
            compressableFiles.push({ type: "imagemin", src, dest });
            return false;
          }
        }

        // Wooooo side effects
        if (src !== staticPath && !fs.statSync(src).isDirectory()) {
          copiedFiles.push({ path: dest });
        }

        return true;
      },
    });

    for (const file of copiedFiles) {
      writtenFiles.push(file);
      log.static("copied", file.path.replace(projectRoot, ""));
    }

    const gzipFiles = compressableFiles.filter((f) => f.type === "gzip");

    for (const file of gzipFiles) {
      const contents = fs.readFileSync(file.src);

      fs.writeFileSync(file.dest, contents);
      log.static(
        "wrote " + file.dest.replace(projectRoot, ""),
        "%c" + superbytes(contents.length)
      );

      writtenFiles.push({ path: file.dest });

      const writePath = file.dest + ".gz";
      const compressed = pako.gzip(contents, {
        level: 9,
      });
      fs.writeFileSync(writePath, compressed);

      const diff = superbytes(contents.length - compressed.length);
      const size = superbytes(compressed.length);
      const printPath = writePath.replace(projectRoot, "");
      log.static("wrote", printPath, `%c${size} (-${diff})`);

      writtenFiles.push({ path: writePath });
    }

    if (buildOptions.compress) {
      const imageGlob = path.join(staticPath, `**/*.{${imageTypes.join(",")}}`);

      const optimizedFiles = await imagemin([imageGlob], {
        plugins: [
          imageminJpegtran(),
          imageminPngquant({
            quality: [0.6, 0.8],
          }),
          imageminSvgo({
            plugins: [
              {
                name: "removeViewBox",
                active: false,
              },
            ],
          }),
        ],
      });

      for (const file of optimizedFiles) {
        const stat = fs.statSync(file.sourcePath);

        const outputSize = superbytes(file.data.length);
        const diffSize = superbytes(stat.size - file.data.length);

        const writePath = file.sourcePath.replace(staticPath, buildStaticPath);
        const printPath = writePath.replace(projectRoot, "");

        fs.writeFileSync(writePath, file.data);

        log.static("wrote", printPath, `%c${outputSize} (-${diffSize})`);

        writtenFiles.push({ path: writePath });
      }
    }
  }

  return writtenFiles;
}
