import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import { isFunction, isString } from "./helpers/typeChecking.js";
import { initGlobal } from "./helpers/initGlobal.js";
import { parseRoute, sortRoutes } from "./helpers/routing.js";
import { makeDebug } from "./helpers/makeDebug.js";
import { makeStaticFileCache } from "./helpers/makeStaticFileCache.js";

import { makeListener } from "./helpers/makeListener.js";

const IS_DEV = process.env.NODE_ENV !== "production";
const DEFAULT_STATIC_SOURCE = path.join(process.cwd(), process.env.WOOF_STATIC_PATH || "build/static");

/**
 * Cache that serves from an in-memory list of static files.
 */
class StaticCache {
  _values = new Map();
  _statics;

  constructor(statics) {
    const files = makeStaticFileCache(statics);

    for (const file of files) {
      this._values.set(file.href, file);
    }
  }

  get(filePath) {
    return this._values.get(filePath);
  }
}

/**
 * Reads from disk each time to check if files exist for a route.
 */
class NoCache {
  _statics;

  constructor(statics) {
    this._statics = statics;
  }

  get(filePath) {
    for (const loc of this._statics) {
      if (!filePath.startsWith(loc.path)) {
        continue;
      }

      const fileName = filePath.replace(loc.path, "");
      const targetPath = path.join(loc.source, fileName);

      if (fs.existsSync(targetPath)) {
        const hasGZ = fs.existsSync(targetPath + ".gz");

        return {
          source: loc.source,
          path: fileName,
          href: filePath,
          gz: hasGZ ? filePath + ".gz" : null,
        };
      }
    }
  }
}

export function makeApp(options = {}) {
  const debug = makeDebug(options.debug);
  const channel = debug.makeChannel("woof:app");

  const statics = [];
  const globals = {};
  const appContext = {
    routes: [],
    middlewares: [],
    globals: {},
    staticCache: null,
    fallback: null,
    debug,
    cors: null,
  };

  function addRoute(method, url, handlers) {
    appContext.routes.push({ ...parseRoute(url), method, handlers });
    return methods;
  }

  const server = http.createServer(makeListener(appContext));

  const methods = {
    server,

    /**
     * Registers middleware that runs for every request.
     *
     * @param handler - Middleware handler functions.
     */
    use(handler) {
      appContext.middlewares.push(handler);
      return methods;
    },

    /**
     * Configures CORS headers for this app.
     */
    cors(options = {}) {
      appContext.cors = {
        allowOrigin: ["*"],
        allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        ...options,
      };
    },

    /**
     * Add a directory to serve static files from.
     */
    static(path, source) {
      if (path == null && source == null) {
        statics.push({ path: "/", source: DEFAULT_STATIC_SOURCE });
        return methods;
      }

      if (!isString(path)) {
        throw new TypeError(`Expected a 'path' string. Got: ${path} (${typeof path})`);
      }

      if (!isString(source)) {
        throw new TypeError(`Expected a 'source' string. Got: ${source} (${typeof source})`);
      }

      statics.push({ path, source });

      return methods;
    },

    /**
     * Responds with an HTML file when eligible GET and HEAD requests are made.
     * Allows a client app to handle these routes with client side routing.
     *
     * @param index - Default HTML file.
     */
    fallback(index = "index.html") {
      if (appContext.fallback) {
        channel.warn(`app.fallback() has already been called. Only the most recent fallback will apply.`);
      }

      appContext.fallback = index;

      return methods;
    },

    /**
     * Registers a global on the app. Globals can be referenced in views and other globals.
     *
     * @param name - Unique string to name this global.
     * @param fn - A function to create the global registered under this `name`.
     */
    global(name, fn) {
      if (!isFunction(fn)) {
        throw new TypeError(`Expected a global function. Got: ${fn} (${typeof fn})`);
      }

      if (!globals[name]) {
        globals[name] = fn;
      }

      Object.defineProperty(appContext.globals, name, {
        get() {
          throw new Error(
            `Global '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other globals that access it.`
          );
        },
        configurable: true,
      });

      return methods;
    },

    get(url, ...handlers) {
      return addRoute("GET", url, handlers);
    },

    post(url, ...handlers) {
      return addRoute("POST", url, handlers);
    },

    put(url, ...handlers) {
      return addRoute("PUT", url, handlers);
    },

    patch(url, ...handlers) {
      return addRoute("PATCH", url, handlers);
    },

    delete(url, ...handlers) {
      return addRoute("DELETE", url, handlers);
    },

    head(url, ...handlers) {
      return addRoute("HEAD", url, handlers);
    },

    /**
     * Mounts a router on this app.
     *
     * @param args - Either (prefix, router) or just (router) to mount at the root.
     */
    mount(...args) {
      let prefix = "";

      if (typeof args[0] === "string") {
        prefix = args.shift();
      }

      const router = args[0];
      for (const route of router._routes) {
        addRoute(route.method, `${prefix}/${route.url}`, router._middlewares.concat(route.handlers));
      }
    },

    /**
     * Starts an HTTP server on the specified port and begins listening for requests.
     */
    async listen(port) {
      if (IS_DEV) {
        appContext.staticCache = new NoCache(statics);
      } else {
        appContext.staticCache = new StaticCache(statics);
      }

      // Sort routes by specificity before any matches are attempted.
      appContext.routes = sortRoutes(appContext.routes);

      return new Promise(async (resolve) => {
        // init globals
        for (const name in globals) {
          const fn = globals[name];
          const global = await initGlobal(fn, {
            appContext,
            name,
          });

          Object.defineProperty(appContext.globals, name, {
            value: global,
            writable: false,
            configurable: false,
          });
        }

        server.listen(port, () => {
          resolve({ port });
        });
      });
    },
  };

  return methods;
}
