import http from "http";
import { isFunction, isObject, isString, isTemplate } from "./helpers/typeChecking.js";
import { initService } from "./helpers/initService.js";
import { parseRoute, matchRoute, sortRoutes } from "./helpers/routing.js";
import { makeDebug } from "./helpers/makeDebug.js";
// import busboy from "busboy";
// import { formidable } from "formidable";

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
    mount: (...args) => {
      let prefix = "";

      if (typeof args[0] == "string") {
        prefix = args.shift();
      }

      const router = args[0];
      for (const r of router.routes()) {
        route(r.method, `${prefix}/${r.url}`, r.handlers);
      }
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
              // const bb = busboy({ headers: req.headers });
              // bb.on("file", (name, file, info) => {
              //   const { filename, encoding, mimeType } = info;
              //   console.log(`File [${name}]: filename: %j, encoding: %j, mimeType: %j`, filename, encoding, mimeType);
              //   file
              //     .on("data", (data) => {
              //       console.log(`File [${name}] got ${data.length} bytes`);
              //     })
              //     .on("close", () => {
              //       console.log(`File [${name}] done`);
              //     });
              // });
              // bb.on("field", (name, val, info) => {
              //   console.log(`Field [${name}]: value: %j`, val);
              // });
              // bb.on("close", () => {
              //   console.log("Done parsing form!");
              //   res.writeHead(303, { Connection: "close", Location: "/" });
              //   res.end();
              // });
              // req.pipe(bb);

              // const form = formidable({ multiples: true });

              // form.parse(req, (err, fields, files) => {
              //   if (err) {
              //     res.writeHead(err.httpCode || 400, { "Content-Type": "text/plain" });
              //     res.end(String(err));
              //     return;
              //   }
              //   // res.writeHead(200, { "Content-Type": "application/json" });
              //   // res.end(JSON.stringify({ fields, files }, null, 2));

              //   console.log("DONE");
              // });

              let index = -1;
              const handlers = [...middlewares, ...matched.data.handlers];

              const nextFunc = async () => {
                index++;
                current = handlers[index];

                const next = index === handlers.length - 1 ? undefined : nextFunc;
                ctx.response.body = (await current(ctx, next)) || ctx.response.body;
              };

              await nextFunc();

              if (ctx.response.body) {
                if (isTemplate(ctx.response.body)) {
                  ctx.response.body = await ctx.response.body.init(appContext);
                  ctx.response.headers["Content-Type"] = "text/html";
                  res.writeHead(ctx.response.status, ctx.response.headers);
                  res.end(ctx.response.body);
                } else if (isObject(ctx.response.body)) {
                  ctx.response.headers["Content-Type"] = "application/json";
                  res.writeHead(ctx.response.status, ctx.response.headers);
                  res.end(JSON.stringify(ctx.response.body));
                } else if (isString(ctx.response.body)) {
                  ctx.response.headers["Content-Type"] = "text/plain";
                  res.writeHead(ctx.response.status, ctx.response.headers);
                  res.end(ctx.response.body);
                }
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
