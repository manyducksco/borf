import fs from "fs";
import path from "path";
import { isString, isTemplate } from "./helpers/typeChecking.js";
import { matchRoute } from "./helpers/routing.js";
import { parseFormBody } from "./helpers/parseFormBody.js";
import { EventSource } from "./objects/EventSource.js";
import { Request } from "./objects/Request.js";
import { Response } from "./objects/Response.js";
import { Headers } from "./objects/Headers.js";

/**
 * Returns a request handler callback for a node `http` server.
 */
export function makeListener(appContext) {
  return async function requestListener(req, res) {
    const { routes, globals, middlewares, cors } = appContext;
    const headers = new Headers();

    if (cors) {
      // set these headers for both preflight and normal requests
      if (cors.allowOrigin.includes("*")) {
        headers.set("access-control-allow-origin", "*");
      } else {
        headers.set(
          "access-control-allow-origin",
          cors.allowOrigin.includes(req.headers.origin) ? req.headers.origin : false
        );
        headers.append("vary", "Origin");
      }

      if (cors.allowCredentials) {
        headers.set("access-control-allow-credentials", "true");
      }

      if (cors.exposeHeaders) {
        headers.set("access-control-expose-headers", cors.exposeHeaders.join(", "));
      }

      if (req.method === "OPTIONS") {
        // preflight
        headers.set("access-control-allow-methods", cors.allowMethods.join(", "));

        if (cors.allowHeaders) {
          headers.set("access-control-allow-headers", cors.allowHeaders.join(", "));
        } else if (req.headers["access-control-request-headers"]) {
          headers.set("access-control-allow-headers", req.headers["access-control-request-headers"]);
          headers.append("vary", "Access-Control-Request-Headers");
        }

        if (cors.maxAge) {
          headers.set("access-control-max-age", cors.maxAge);
        }

        headers.set("content-length", "0");
        res.writeHead(204, headers.toJSON());
        res.end();
        return;
      }
    }

    const matched = matchRoute(routes, req.url, {
      willMatch: (route) => {
        return route.method === req.method;
      },
    });

    if (matched) {
      const request = new Request(req, matched);
      const response = new Response();
      response.headers = headers;

      let eventSourceCallback;

      const ctx = {
        cache: {},
        service(name) {
          if (!isString(name)) {
            throw new Error(`Expected a string for service name. Got: ${name}`);
          }

          if (services[name]) {
            return services[name];
          }

          throw new Error(`Service '${name}' is not registered on this app.`);
        },
        request,
        response,
        redirect(to, statusCode = 301) {
          response.status = statusCode;
          response.headers.set("Location", to);
        },
        eventSource(fn) {
          eventSourceCallback = fn;
        },
      };

      const contentType = request.headers.get("content-type");

      if (contentType && matched.data.method !== "GET") {
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
        let current = handlers[index];

        ctx.next = index === handlers.length - 1 ? undefined : nextFunc;
        ctx.response.body = (await current(ctx)) || ctx.response.body;
      };

      try {
        await nextFunc();
      } catch (err) {
        ctx.response.status = 500;
        ctx.response.body = {
          error: {
            message: err.message,
            stack: err.stack,
          },
        };

        console.error(err);
      }

      if (eventSourceCallback) {
        const source = new EventSource(eventSourceCallback);
        source.start(res);
        return;
      }

      // Automatically handle content-type and body formatting when returned from handler function.
      if (ctx.response.body) {
        if (isTemplate(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/html");
          ctx.response.body = await ctx.response.body.render();
        } else if (isString(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/plain");
        } else if (!ctx.response.headers.has("content-type")) {
          ctx.response.headers.set("content-type", "application/json");
          ctx.response.body = JSON.stringify(ctx.response.body);
        }
      }

      res.writeHead(ctx.response.status, ctx.response.headers.toJSON());

      if (ctx.response.body != null) {
        res.write(Buffer.from(ctx.response.body));
      }

      res.end();
    } else if (!canStatic(req)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found." }));
    } else {
      req.url = normalizePath(req.url);

      let fallback = appContext.fallback ? normalizePath(appContext.fallback) : null;
      let match = appContext.staticCache[req.url];

      if (fallback && canFallback(req)) {
        match = appContext.staticCache[fallback];
      }

      if (!match) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found." }));
        return;
      }

      let filePath = path.join(match.source, match.path);

      const acceptEncoding = req.headers["accept-encoding"] || "";

      if (match.gz && acceptEncoding.includes("gzip")) {
        const { type, charset } = match;

        res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");

        filePath = path.join(match.source, match.gz);
      }

      const stream = fs.createReadStream(filePath);

      stream.on("error", function onError(err) {
        console.error(err);
        res.writeHead(500);
        res.end();
      });

      stream.pipe(res);
    }
  };
}

function canFallback(req) {
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

function canStatic(req) {
  const { method } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  return true;
}

function normalizePath(p) {
  if (!p.startsWith("/")) {
    return "/" + p;
  }

  return p;
}
