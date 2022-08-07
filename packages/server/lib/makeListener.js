import fs from "fs";
import path from "path";
import send from "send";
import { isObject, isString, isTemplate } from "./helpers/typeChecking.js";
import { matchRoute } from "./helpers/routing.js";
import { parseFormBody } from "./helpers/parseFormBody.js";
import { EventSource } from "./helpers/EventSource.js";

const mime = send.mime;

/**
 * Returns a request handler callback for a node `http` server.
 */
export function makeListener(appContext) {
  const staticPath = fs.existsSync(appContext.staticPath) ? path.resolve(appContext.staticPath) : null;
  const hasIndexHTML = staticPath && fs.existsSync(path.join(staticPath, "index.html"));

  return async function requestListener(req, res) {
    const { routes, services, middlewares } = appContext;

    const matched = matchRoute(routes, req.url, {
      willMatch: (route) => {
        return route.method === req.method;
      },
    });

    if (matched) {
      const request = {
        url: req.url,
        path: matched.path,
        params: matched.params,
        query: matched.query,
        method: req.method,
        headers: req.headers,
        body: undefined,
        socket: req.socket,
      };

      const response = {
        status: 200,
        headers: {},
        body: undefined,
      };

      const ctx = {
        cache: {},
        services,
        request,
        response,
        redirect(to, statusCode = 301) {
          response.status = statusCode;
          response.headers["Location"] = to;
        },
      };

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

      try {
        await nextFunc();
      } catch (err) {
        ctx.response.status = 500;
        ctx.response.body = {
          error: err.message,
        };

        if (typeof err.captureStackTrace === "function") {
          err.captureStackTrace(ctx.response.body);
        }
      }

      if (ctx.response.body && ctx.response.body instanceof EventSource) {
        ctx.response.body.start(res);
        return;
      }

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
      // Try serving static files, otherwise return 404.
      if (req.method === "GET" || req.method === "HEAD") {
        if (hasIndexHTML && canFallBackToIndexHTML(req)) {
          req.url = "/index.html";
        } else if (staticPath != null) {
          const acceptEncoding = req.headers["accept-encoding"] || "";

          // Check if .gz version of asset exists and serve it.
          if (acceptEncoding.includes("gzip") && fs.existsSync(path.join(staticPath, req.url + ".gz"))) {
            const type = mime.lookup(req.url);
            const charset = mime.charsets.lookup(type);

            res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
            res.setHeader("Content-Encoding", "gzip");
            res.setHeader("Vary", "Accept-Encoding");

            req.url += ".gz";
            console.log("serving gzip version: " + req.url);
          }
        }

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
  // if (method !== "GET" && method !== "HEAD") {
  //   return false;
  // }

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
