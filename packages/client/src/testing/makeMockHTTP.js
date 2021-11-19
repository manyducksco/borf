import { HTTP } from "../data/HTTP";
import { parseRoute, matchRoute, sortedRoutes } from "../routing/utils";

export const route = {
  get: (path, responder) => ({
    method: "get",
    path,
    responder,
  }),
  put: (path, responder) => ({
    method: "put",
    path,
    responder,
  }),
  patch: (path, responder) => ({
    method: "patch",
    path,
    responder,
  }),
  post: (path, responder) => ({
    method: "post",
    path,
    responder,
  }),
  delete: (path, responder) => ({
    method: "delete",
    path,
    responder,
  }),
};

const responder = (ctx, res) => {
  ctx.request.headers;
  ctx.request.params;
  ctx.request.url;

  // To respond, call the res function with any number of helpers to modify the response.
  return res(
    ctx.status(200),
    ctx.headers("name", "value"),
    ctx.json({ someData: 5 })
  );
};

export function makeMockHTTP(...routes) {
  // - Define mock fetch function that responds with the passed routes
  // - Create new HTTP instance with the mock fetch function
  // - Add a .mock() method to HTTP instance to receive mock stats

  const matchables = sortedRoutes(
    routes.map((route) => {
      return {
        ...route,
        ...parseRoute(route),
      };
    })
  );

  async function mockFetch(url, options = {}) {
    const method = (options.method || "get").toLowerCase();
    const routes = matchables.filter((m) => m.method === method);
    const matched = matchRoute(routes, url);

    console.log(url, options, matched);

    if (matched) {
    } else {
      return new Response(null, {
        status: 404,
      });
    }
  }

  const http = new HTTP({
    fetch: mockFetch,
  });

  // http.mock = http
}
