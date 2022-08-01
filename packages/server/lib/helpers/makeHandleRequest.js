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
    const { routes, services, middlewares } = appContext;

    const ctx = {
      cache: {},
      services,
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: undefined,
      },
      response: {
        status: 200,
        headers: {},
        body: undefined,
      },

      // TODO: Use node request and response instead of custom objects to allow streams and advanced request handling.
      // _req: req,
      // _res: res,

      redirect: (to, statusCode = 301) => {
        ctx.response.status = statusCode;
        ctx.response.headers["Location"] = to;
      },
      // makeEventSource: (options = {}) => {
      //   res.writeHead(200, {
      //     "Cache-Control": "no-cache",
      //     "Content-Type": "text/event-stream",
      //     Connection: "keep-alive",
      //   });

      //   // Tell the client to retry every 10 seconds if connectivity is lost
      //   res.write(`retry: ${options.retryTimeout || 10000}\n\n`);

      //   const update = () => {
      //     res.write(`data: ${Math.round(Math.random() * 9999999)}\n\n`);
      //   };

      //   res.on("close", () => {
      //     res.end();
      //   });

      //   return {
      //     sendData: (data) => {
      //       res.write(`data: ${data}\n\n`);
      //     },
      //     sendEvent: (name, data) => {
      //       res.write(`event: ${name}\ndata: ${data}\n\n`);
      //     },
      //     close: () => {},
      //   };
      // },
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
          ctx.request.body = await parseFormBody(req);
        }
      }

      let index = -1;
      const handlers = [...middlewares, ...matched.data.handlers];

      const nextFunc = async () => {
        index++;
        const current = handlers[index];

        const next = index === handlers.length - 1 ? undefined : nextFunc;
        ctx.response.body = (await current(ctx, next)) || ctx.response.body;
      };

      await nextFunc();

      // Automatically handle content-type and body formatting when returned from handler function.
      if (!res.headersSent && !res.writableEnded && ctx.response.body) {
        if (isTemplate(ctx.response.body)) {
          res.setHeader("content-type", "text/html");
          res.write(await ctx.response.body.render());
        } else if (isObject(ctx.response.body)) {
          res.setHeader("content-type", "application/json");
          res.write(JSON.stringify(ctx.response.body));
        } else if (isString(ctx.response.body)) {
          res.setHeader("content-type", "text/plain");
          res.write(ctx.response.body);
        }
      }

      // Send headers if they haven't yet been sent.
      if (!res.headersSent) {
        res.writeHead(ctx.response.status, ctx.response.headers);
      }

      // End the request if it hasn't yet been ended.
      if (!res.writableEnded) {
        res.end();
      }
    } else {
      if (hasIndexHTML && canFallBackToIndexHTML(req)) {
        req.url = "/index.html";
      }

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
