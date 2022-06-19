import { matchRoute, parseRoute, sortRoutes } from "../helpers/routing.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";

const { Response } = require("fetch-ponyfill")();

/**
 * Creates a `fetch`-compatible function that responds with its own mock handlers.
 *
 * @example
 * import { makeMockFetch } from "@woofjs/app/testing";
 *
 * // Create a mock HTTP instance
 * const fetch = makeMockFetch((self) => {
 *   self.get("/example/route", (ctx) => {
 *     // Respond with JSON
 *     return {
 *       message: "success"
 *     }
 *   });
 *
 *   self.put("/users/:id", (ctx) => {
 *     ctx.response.status = 200;
 *
 *     return {
 *       message: `user ${ctx.request.params.id} updated`
 *     }
 *   });
 * });
 *
 * fetch("/example/route")
 *   .then(res => res.json())
 *   .then(json => {
 *     console.log(json.message); // "success"
 *   });
 */
export function makeMockFetch(fn) {
  let routes = [];
  const calls = [];

  const self = {
    handle(method, url, handler) {
      routes.push({
        method,
        url,
        fragments: parseRoute(url).fragments,
        handler,
      });

      return self;
    },

    get(url, handler) {
      return self.handle("get", url, handler);
    },

    put(url, handler) {
      return self.handle("put", url, handler);
    },

    patch(url, handler) {
      return self.handle("patch", url, handler);
    },

    post(url, handler) {
      return self.handle("post", url, handler);
    },

    delete(url, handler) {
      return self.handle("delete", url, handler);
    },
  };

  fn(self);

  routes = sortRoutes(routes);

  function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const method = (options.method || "get").toLowerCase();
      const matched = matchRoute(routes, url, {
        willMatch: (route) => route.method === method,
      });

      if (matched == null) {
        return reject(new Error(`Requested URL has no handlers. Received: ${method} ${url}`));
      }

      const headers = {};
      let body;

      if (options.headers) {
        if (!isFunction(options.headers.entries)) {
          options.headers = new Headers(options.headers);
        }

        for (const entry of options.headers.entries()) {
          headers[entry[0]] = entry[1];
        }
      }

      if (options.body) {
        if (headers["content-type"] === "application/json") {
          body = JSON.parse(options.body);
        } else {
          body = options.body;
        }
      }

      const request = {
        method,
        url,
        headers,
        body,
        params: matched.params,
        query: matched.query,
      };

      calls.push(request);

      const ctx = {
        request,
        response: {
          status: 200,
          body: undefined,
          headers: {},
        },
      };

      const result = matched.data.handler(ctx);

      if (result && isFunction(result.then)) {
        result.then((body) => {
          if (body) {
            if (!ctx.response.headers["content-type"]) {
              ctx.response.headers["content-type"] = "application/json";
            }

            ctx.response.body = JSON.stringify(body);
          }

          resolve(
            new Response(ctx.response.body, {
              headers: ctx.response.headers,
              status: ctx.response.status,
            })
          );
        });
      } else {
        if (result) {
          if (!ctx.response.headers["content-type"]) {
            ctx.response.headers["content-type"] = "application/json";
          }

          ctx.response.body = JSON.stringify(result);
        }

        resolve(
          new Response(ctx.response.body, {
            headers: ctx.response.headers,
            status: ctx.response.status,
          })
        );
      }
    });
  }

  fetch.mock = {
    calls,
  };

  return fetch;
}
