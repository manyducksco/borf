import { isFunction } from "../helpers/typeChecking.js";

function makeRouter() {
  return {
    on() {
      console.warn(`Unimplemented mock`);
    },
    match() {
      console.warn(`Unimplemented mock`);
    },
  };
}

/**
 * Creates a `fetch`-compatible function that responds with its own mock handlers.
 * Returns a 404 response for any unmatched routes.
 *
 * @example
 * import { makeMockFetch } from "@woofjs/app/testing";
 *
 * // Create a mock HTTP instance
 * const fetch = makeMockFetch((self) => {
 *   self.get("/example/route", (req, res) => {
 *     res.json({
 *       message: "success"
 *     });
 *   });
 *
 *   self.post("/users/:id", (req, res) => {
 *     res.status(200).json({
 *       message: "user created"
 *     });
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
  const router = makeRouter();
  const calls = [];

  const self = {
    handle(method, url, handler) {
      router.on(url, {
        method: method.toLowerCase(),
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

  function fetch(url, options = {}) {
    return new Promise((resolve) => {
      const method = (options.method || "get").toLowerCase();
      const matched = router.match(url, {
        willMatch: (route) => route.props.method === method,
      });

      if (matched == null) {
        throw new Error(`Requested URL has no handlers. Received: ${method} ${url}`);
      }

      const headers = {};
      let body;

      if (options.headers) {
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

      const req = {
        method,
        url,
        headers,
        body,
        params: matched.params,
        query: matched.query,
      };

      calls.push(req);

      if (matched) {
        const ctx = {
          status: 200,
          body: undefined,
          headers: {},
        };

        const res = {
          status(code) {
            ctx.status = code;
          },
          json(data) {
            ctx.body = data;
          },
          headers(headers) {
            Object.assign(ctx.headers, headers);
          },
        };

        const result = matched.props.handler(req, res);

        if (result && isFunction(result.then)) {
          result.then(() => {
            resolve(
              new Response(ctx.body, {
                headers: ctx.headers,
                status: ctx.status,
              })
            );
          });
        } else {
          resolve(
            new Response(ctx.body, {
              headers: ctx.headers,
              status: ctx.status,
            })
          );
        }
      } else {
        resolve(
          new Response(null, {
            status: 404,
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
