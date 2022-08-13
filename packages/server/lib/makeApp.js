import http from "http";
import path from "path";
import fs from "fs";
import { isFunction } from "./helpers/typeChecking.js";
import { initService } from "./helpers/initService.js";
import { parseRoute, sortRoutes } from "./helpers/routing.js";
import { makeDebug } from "./helpers/makeDebug.js";

import { makeListener } from "./makeListener.js";

export function makeApp(options = {}) {
  const debug = makeDebug(options.debug);

  const registeredServices = {};
  const appContext = {
    routes: [],
    middlewares: [],
    services: {},
    debug,
    staticPath: path.join(process.cwd(), process.env.WOOF_STATIC_PATH || "build/static"),
  };

  function addRoute(method, url, handlers) {
    appContext.routes.push({ ...parseRoute(url), method, handlers });
    return methods;
  }

  const server = http.createServer(makeListener(appContext));

  const methods = {
    server,

    /**
     * Choose a custom directory to serve static files from. Set to `false` to disable the static file server.
     */
    static(directory) {
      if (typeof directory === "boolean") {
        if (directory === false) {
          appContext.staticPath = null;
        }
      } else if (typeof directory === "string") {
        if (!path.isAbsolute(directory)) {
          directory = path.resolve(process.cwd(), directory);
        }

        if (!fs.existsSync(directory)) {
          throw new Error(`Static directory '${directory}' doesn't exist!`);
        }

        appContext.staticPath = directory;
      } else {
        throw new TypeError(`Expected a boolean or string. Got: ${directory}`);
      }
    },

    /**
     * Registers a service on the app. Services can be referenced in
     * Services and Components using `self.getService(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - A service to create and register under the name.
     * @param config - Configuration options for the service. Can contain an `options` object that is passed to the service.
     */
    service(name, service, config = {}) {
      if (!isFunction(service)) {
        throw new TypeError(`Expected a service function. Got: ${service} (${typeof service})`);
      }

      if (!registeredServices[name]) {
        registeredServices[name] = {
          fn: service,
          instance: null,
          options: null,
        };
      }

      Object.defineProperty(appContext.services, name, {
        get() {
          throw new Error(
            `Service '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other services that access it.`
          );
        },
        configurable: true,
      });

      // Merge with existing fields if overwriting.
      registeredServices[name].fn = service;

      if (config.options !== undefined) {
        registeredServices[name].options = config.options;
      }

      return methods;
    },
    /**
     * Registers function at route with method GET.
     *
     * @param url - API path.
     * @param func - Logic.
     */
    get: (url, ...handlers) => {
      return addRoute("GET", url, handlers);
    },
    post: (url, ...handlers) => {
      return addRoute("POST", url, handlers);
    },
    put: (url, ...handlers) => {
      return addRoute("PUT", url, handlers);
    },
    patch: (url, ...handlers) => {
      return addRoute("PATCH", url, handlers);
    },
    delete: (url, ...handlers) => {
      return addRoute("DELETE", url, handlers);
    },
    options: (url, ...handlers) => {
      return addRoute("OPTIONS", url, handlers);
    },
    head: (url, ...handlers) => {
      return addRoute("HEAD", url, handlers);
    },
    use: (handler) => {
      appContext.middlewares.push(handler);
      return methods;
    },
    mount: (...args) => {
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
      // Sort routes by specificity before any matches are attempted.
      appContext.routes = sortRoutes(appContext.routes);

      return new Promise(async (resolve) => {
        // init services
        for (const name in registeredServices) {
          const service = registeredServices[name];

          service.instance = await initService(appContext, service.fn, debug.makeChannel(`service:${name}`), {
            name,
            options: service.options,
          });

          Object.defineProperty(appContext.services, name, {
            value: service.instance.exports,
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
