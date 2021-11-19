import { HTTP } from "../data/HTTP";
import { createRouter } from "../routing/utils";

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
  ctx.request.path;

  // To respond, call the res function with any number of helpers to modify the response.
  return res(
    ctx.status(200),
    ctx.headers("name", "value"),
    ctx.json({ someData: 5 })
  );
};

function createContext() {
  return {
    request: {},
    json(value) {
      return [
        {
          field: "headers",
          value: { "Content-Type": "application/json" },
        },
        {
          field: "body",
          value: JSON.stringify(value),
        },
      ];
    },
    headers(...args) {
      let value = {};

      if (args.length === 1) {
        value = args[0]; // object with multiple headers
      }

      if (args.length === 2) {
        value[args[0]] = args[1]; // key and value
      }

      return [
        {
          field: "headers",
          value,
        },
      ];
    },
    status(code) {
      return [
        {
          field: "status",
          value: code,
        },
      ];
    },
  };
}

function flatMap(arr) {
  const flattened = [];

  for (const item of arr) {
    if (Array.isArray(item)) {
      flattened.push(...flatMap(item));
    } else {
      flattened.push(item);
    }
  }

  return flattened;
}

export function makeMockHTTP(routes) {
  // - Define mock fetch function that responds with the passed routes
  // - Create new HTTP instance with the mock fetch function
  // - Add a .mock() method to HTTP instance to receive mock stats

  const router = createRouter();

  const stats = {
    calls: [],
  };

  routes.forEach((route) => {
    router.on(route.path, {
      method: route.method,
      responder: route.responder,
    });
  });

  const mockFetch = async (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const method = (options.method || "get").toLowerCase();
      const matched = router.match(path, {
        filter: (route) => {
          return route.attributes.method === method;
        },
      });

      stats.calls.push({
        method,
        url: path,
        params: matched.params,
        headers: options.headers || {},
      });

      const res = (...fields) => {
        const ctx = {
          status: 200,
          body: undefined,
          headers: {},
        };

        flatMap(fields).forEach(({ field, value }) => {
          switch (field) {
            case "headers":
              Object.assign(ctx.headers, value);
              break;
            default:
              ctx[field] = value;
              break;
          }
        });

        resolve(
          new Response(ctx.body, {
            headers: ctx.headers,
            status: ctx.status,
          })
        );
      };

      if (matched) {
        const { responder } = matched.attributes;

        responder(createContext(), res);
      } else {
        resolve(
          new Response(null, {
            status: 404,
          })
        );
      }
    });
  };

  const http = new HTTP({
    fetch: mockFetch,
  });

  return { http, stats };
}
