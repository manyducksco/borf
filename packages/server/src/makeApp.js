import http from "http";
import { isFunction } from "./helpers/typeChecking.js";
import { initService } from "./helpers/initService.js";
import { parseRoute, matchRoute, sortRoutes } from "./helpers/routing.js";
import { makeDebug } from "./helpers/makeDebug.js";

export function makeApp() {
  const debug = makeDebug();

  let routes = [];
  let middlewares = [];
  const registeredServices = {};

  const appContext = {
    services: {},
    debug,
  };

  function route(method, url, handlers) {
    routes.push({ ...parseRoute(url), method, handlers });
    return methods;
  }

  function middleware(handler) {
    middlewares.push(handler);
    return methods;
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
      return route("GET", url, handlers);
    },
    post: (url, ...handlers) => {
      return route("POST", url, handlers);
    },
    put: (url, ...handlers) => {
      return route("PUT", url, handlers);
    },
    patch: (url, ...handlers) => {
      return route("PATCH", url, handlers);
    },
    delete: (url, ...handlers) => {
      return route("DELETE", url, handlers);
    },
    options: (url, ...handlers) => {
      return route("OPTIONS", url, handlers);
    },
    head: (url, ...handlers) => {
      return route("HEAD", url, handlers);
    },
    use: (handler) => {
      return middleware(handler);
    },
    listen: async (port) => {
      routes = sortRoutes(routes);

      return new Promise(async (resolve, reject) => {
        // init services
        for (const name in registeredServices) {
          const service = registeredServices[name];

          // First bits of app code are run; service functions called.
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
              services: appContext.services,
              redirect: () => {},
            };

            const matched = matchRoute(routes, req.url, {
              willMatch: (route) => {
                return route.method == req.method;
              },
            });

            if (matched) {
              let index = -1;
              const handlers = [...middlewares, ...matched.data.handlers];

              const nextFunc = async () => {
                index++;
                current = handlers[index];

                const next = index == handlers.length - 1 ? undefined : nextFunc;
                ctx.response.body = (await current(ctx, next)) || ctx.response.body;
              };

              await nextFunc();

              if (ctx.response.body && typeof ctx.response.body == "object") {
                ctx.response.headers["Content-Type"] = "application/json";
                res.writeHead(ctx.response.status, ctx.response.headers);
                res.end(JSON.stringify(ctx.response.body));
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
