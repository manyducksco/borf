import http from "http";
import { parseRoute, matchRoute, sortRoutes } from "./helpers/routing.js";

let routes = [];

export function makeApp() {
  return {
    get: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "GET", func });
    },
    post: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "POST", func });
    },
    put: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "PUT", func });
    },
    patch: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "PATCH", func });
    },
    delete: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "DELETE", func });
    },
    options: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "OPTIONS", func });
    },
    head: (url, func) => {
      routes.push({ ...parseRoute(url), verb: "HEAD", func });
    },
    listen: async (port) => {
      routes = sortRoutes(routes);

      return new Promise((resolve, reject) => {
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
              request: {
                verb: req.method,
                headers: req.headers,
                body,
              },
              response: {},
            };

            const matched = matchRoute(routes, req.url, {
              willMatch: (route) => {
                return route.verb == req.method;
              },
            });

            if (matched) {
              res.writeHead(200, { "Content-Type": "application/json" });
              const rRes = matched.data.func(ctx);
              res.end(JSON.stringify(rRes));
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
}
