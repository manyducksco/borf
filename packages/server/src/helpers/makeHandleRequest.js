import fs from "fs";
import path from "path";
import send from "send";
import { isObject, isString, isTemplate } from "./typeChecking.js";
import { matchRoute } from "./routing.js";
import { parseFormBody } from "./parseFormBody.js";

/**
 * Takes an appContext and returns a request handling callback for a node http server.
 */
export function makeHandleRequest(appContext) {
  const staticPath = fs.existsSync(appContext.staticPath) ? path.resolve(appContext.staticPath) : null;
  const hasIndexHTML = staticPath && fs.existsSync(path.join(staticPath, "index.html"));

  return async function handleRequest(req, res) {
    if (hasIndexHTML && canFallBackToIndexHTML(req)) {
      req.url = "/index.html";
    }

    const { routes, services, middlewares } = appContext;

    const ctx = {
      cache: {},
      services,
      request: {
        method: req.method,
        headers: req.headers,
        body: undefined,
      },
      response: {
        status: 200,
        headers: {},
        body: undefined,
      },
      redirect: (to, status = 301) => {
        ctx.response.status = status;
        ctx.response.headers["Location"] = to;
      },
      makeEventSource: () => {
        return {
          send: () => {},
          emit: () => {},
          close: () => {},
        };
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
      // Try serving static files, otherwise return 404.
      if (req.method === "GET" || req.method === "HEAD") {
        const stream = send(req, req.url, {
          root: staticPath,
          maxage: 0,
        });

        stream.on("error", function onError(err) {
          res.writeHead(err.status);
          res.end();
        });

        stream.pipe(res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found." }));
      }
    }
  };
}

function canFallBackToIndexHTML(req) {
  const { method, headers, url } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  // Accept header is not sent.
  if (!isString(headers.accept)) {
    return false;
  }

  // Client prefers JSON.
  if (headers.accept.startsWith("application/json")) {
    return false;
  }

  // Client doesn't accept HTML.
  if (!headers.accept.startsWith("text/html") && !headers.accept.startsWith("*/*")) {
    return false;
  }

  // Client is requesting file with an extension.
  if (url.lastIndexOf(".") > url.lastIndexOf("/")) {
    return false;
  }

  return true;
}
