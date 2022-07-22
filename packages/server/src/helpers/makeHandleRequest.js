import { isObject, isString, isTemplate } from "./typeChecking.js";
import { matchRoute } from "./routing.js";
import { parseFormBody } from "./parseFormBody.js";

/**
 * Takes an appContext and returns a request handling callback for a node http server.
 */
export function makeHandleRequest(appContext) {
  return async function handleRequest(req, res) {
    const { routes, services, middlewares } = appContext;

    const ctx = {
      cache: {},
      services,
      request: {
        method: req.method,
        headers: req.headers,
        body: null,
      },
      response: {
        status: 200,
        headers: {},
      },
      redirect: (to, status = 301) => {
        ctx.response.status = status;
        ctx.response.headers["Location"] = to;
      },
    };

    const matched = matchRoute(routes, req.url, {
      willMatch: (route) => {
        return route.method == req.method;
      },
    });

    if (matched) {
      const contentType = req.headers["content-type"];

      if (contentType) {
        if (contentType.startsWith("application/json")) {
          const buffers = [];

          for await (const chunk of req) {
            buffers.push(chunk);
          }

          const data = Buffer.concat(buffers).toString();

          ctx.request.body = JSON.parse(data);
        }

        if (
          contentType.startsWith("application/x-www-form-urlencoded") ||
          contentType.startsWith("multipart/form-data")
        ) {
          const start = performance.now();
          ctx.request.body = await parseFormBody(req);
          console.log(`Parsed form in ${performance.now() - start}ms`);
        }
      }

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
          ctx.response.body = "<!DOCTYPE html>" + ctx.response.body; // Prepend doctype for HTML pages.
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
  };
}
