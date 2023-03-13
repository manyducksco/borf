import { Type } from "../Type/Type.js";
import { Router } from "../Router/Router.js";

type HandlerContext = {};

type MockFetchRoute = {
  method: string;
  url: string;
  respond: (ctx: HandlerContext) => any;
};

type MockFetchRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  params: Record<string, string | number>;
  query: Record<string, string | number | boolean>;
};

/**
 * Creates a `fetch`-compatible function that responds to requests with mock handlers.
 */
export function makeMockFetch(routes: MockFetchRoute[]) {
  const router = new Router<MockFetchRoute>();

  for (const route of routes) {
    router.addRoute(route.url, route);
  }

  const requests: MockFetchRequest[] = [];

  function fetch(url: string, options: RequestInit = {}) {
    return new Promise((resolve, reject) => {
      const method = (options.method || "get").toLowerCase();
      const matched = router.match(url, {
        willMatch: (route) => route.meta.method === method,
      });

      if (matched == null) {
        return reject(
          new Error(`Requested URL has no handlers. Received: ${method} ${url}`)
        );
      }

      const headers: Record<string, string> = {};
      let body;

      if (options.headers) {
        if (!Type.isFunction(options.headers.entries)) {
          options.headers = new Headers(options.headers);
        }

        for (const entry of Object.entries(options.headers)) {
          headers[entry[0]] = entry[1];
        }
      }

      if (options.body) {
        if (headers["content-type"] === "application/json") {
          body = JSON.parse(options.body as string);
        } else {
          body = options.body;
        }
      }

      const request: MockFetchRequest = {
        method,
        url,
        headers,
        body,
        params: matched.params,
        query: matched.query,
      };

      requests.push(request);

      type ResponseContext = {
        request: MockFetchRequest;
        response: {
          status: number;
          body: any;
          headers: Record<string, string>;
        };
      };

      const ctx: ResponseContext = {
        request,
        response: {
          status: 200,
          body: undefined,
          headers: {},
        },
      };

      const result = matched.meta.respond(ctx);

      if (result && Type.isFunction(result.then)) {
        result.then((body: any) => {
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
    requests,
  };

  return fetch;
}
