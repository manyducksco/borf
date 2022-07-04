import http from "http";
import { isFunction } from "./helpers/typeChecking.js";
import { initService } from "./helpers/initService.js";
import { parseRoute, matchRoute, sortRoutes } from "./helpers/routing.js";
import { makeDebug } from "./helpers/makeDebug.js";

export function makeApp() {
  const debug = makeDebug();

  let routes = [];
  let services = {};

  function route(method, url, func) {
    routes.push({ ...parseRoute(url), method, func });
    return methods;
  }

  function makeGetService({ identifier, type }) {
    /**
     * Returns the named service or throws an error if it isn't registered.
     * Every component and service in the app gets services through this function.
     *
     * @example getService("@page").$title.set("New Page Title")
     *
     * @param name - Name of a service. Built-in services start with `@`.
     */
    return function getService(name) {
      if (services[name]) {
        if (services[name].instance == null) {
          throw new Error(
            `Service '${name}' was requested before it was initialized from ${type} '${identifier}'. Make sure '${name}' is registered before '${identifier}' on your app.`
          );
        }

        return services[name].instance.exports;
      }

      throw new Error(`Service is not registered in this app. Got: ${name}`);
    };
  }

  const methods = {
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

      if (!services[name]) {
        services[name] = {
          fn: service,
          instance: null,
          options: null,
        };
      }

      // Merge with existing fields if overwriting.
      services[name].fn = service;

      if (config.options !== undefined) {
        services[name].options = config.options;
      }

      return methods;
    },
    /**
     * Registers function at route with method GET.
     *
     * @param url - API path.
     * @param func - Logic.
     */
    get: (url, func) => {
      return route("GET", url, func);
    },
    post: (url, func) => {
      return route("POST", url, func);
    },
    put: (url, func) => {
      return route("PUT", url, func);
    },
    patch: (url, func) => {
      return route("PATCH", url, func);
    },
    delete: (url, func) => {
      return route("DELETE", url, func);
    },
    options: (url, func) => {
      return route("OPTIONS", url, func);
    },
    head: (url, func) => {
      return route("HEAD", url, func);
    },
    use: (func) => {},
    listen: async (port) => {
      routes = sortRoutes(routes);

      return new Promise(async (resolve, reject) => {
        // init services
        for (const name in services) {
          const service = services[name];

          // First bits of app code are run; service functions called.
          service.instance = await initService({ makeGetService }, service.fn, debug.makeChannel(`service:${name}`), {
            name,
            options: service.options,
          });
        }

        // init server
        http
          .createServer(async function (req, res) {
            let body = null;
            try {
              const buffers = [];

              for await (const chunk of req) {
                buffers.push(chunk);
              }

              const data = Buffer.concat(buffers).toString();

              body = JSON.parse(data);
            } catch {}

            let ctx = {
              cache: {},
              request: {
                method: req.method,
                headers: req.headers,
                body,
              },
              response: {
                status: 200,
                headers: {},
              },
              getService: (name) => {
                return services[name].instance.exports;
              },
            };

            const matched = matchRoute(routes, req.url, {
              willMatch: (route) => {
                return route.method == req.method;
              },
            });

            if (matched) {
              let body = (await matched.data.func(ctx)) || ctx.response.body;

              if (body && typeof body == "object") {
                ctx.response.headers["Content-Type"] = "application/json";
                res.writeHead(ctx.response.status, ctx.response.headers);
                body = body ? JSON.stringify(body) : body;
                res.end(body);
              } else {
                res.writeHead(ctx.response.status, ctx.response.headers);
                res.end();
              }
            } else {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ message: "Route not found." }));
            }
          })
          .listen(port, () => {
            resolve({ port });
          });
      });
    },
  };

  return methods;
}
