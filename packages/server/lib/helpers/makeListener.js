import fs from "node:fs";
import path from "node:path";
import send from "send";
import { isString, isTemplate, isFunction } from "./typeChecking.js";
import { matchRoute } from "./routing.js";
import { parseFormBody } from "./parseFormBody.js";
import { EventSource } from "../objects/EventSource.js";
import { Request } from "../objects/Request.js";
import { Response } from "../objects/Response.js";
import { Headers } from "../objects/Headers.js";

// Display detailed logging when true.
const VERBOSE_LOGGING = true;

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
        global(name) {
          if (!isString(name)) {
            throw new Error(`Expected a string for global name. Got: ${name}`);
          }

          if (globals[name]) {
            return globals[name].exports;
          }

          throw new Error(`Global '${name}' is not registered on this app.`);
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

      if (!ctx.request.body) {
        const buffers = [];

        for await (const chunk of req) {
          buffers.push(chunk);
        }

        ctx.request.body = Buffer.concat(buffers);
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

      let bodyIsStream = false;

      // Automatically handle content-type and body formatting when returned from handler function.
      if (ctx.response.body) {
        if (isTemplate(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/html");
          ctx.response.body = await ctx.response.body.render();
        } else if (isString(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/plain");
        } else if (isFunction(ctx.response.body.pipe)) {
          // Is a stream; handled below
          bodyIsStream = true;
        } else if (!ctx.response.headers.has("content-type")) {
          ctx.response.headers.set("content-type", "application/json");
          ctx.response.body = JSON.stringify(ctx.response.body);
        }
      }

      res.writeHead(ctx.response.status, ctx.response.headers.toJSON());

      if (bodyIsStream) {
        ctx.response.body.pipe(res);
      } else {
        if (ctx.response.body != null) {
          res.write(Buffer.from(ctx.response.body));
        }

        res.end();
      }
    } else if (!canStatic(req, VERBOSE_LOGGING)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found." }));
    } else {
      req.url = normalizePath(req.url);

      let fallback = appContext.fallback ? normalizePath(appContext.fallback) : null;
      let match = appContext.staticCache.get(req.url);

      if (fallback && canFallback(req, VERBOSE_LOGGING)) {
        match = appContext.staticCache.get(fallback);
      }

      console.log({ fallback, match, url: req.url, method: req.method, cache: appContext.staticCache._statics });

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

      send(req, filePath).pipe(res);
    }
  };
}

function canFallback(req, verbose = false) {
  const { method, headers, url } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    if (verbose) console.log(`[cannot fall back to index: method is not GET or HEAD] ${req.method} ${req.url}`);
    return false;
  }

  // Accept header is not sent.
  if (!isString(headers.accept)) {
    if (verbose) console.log(`[cannot fall back to index: no "Accept" header was sent] ${req.method} ${req.url}`);
    return false;
  }

  // Client prefers JSON.
  if (headers.accept.startsWith("application/json")) {
    if (verbose) console.log(`[cannot fall back to index: client prefers JSON] ${req.method} ${req.url}`);
    return false;
  }

  // Client doesn't accept HTML.
  if (!headers.accept.startsWith("text/html") && !headers.accept.startsWith("*/*")) {
    if (verbose) console.log(`[cannot fall back to index: client doesn't accept HTML] ${req.method} ${req.url}`);
    return false;
  }

  // Client is requesting file with an extension.
  if (url.lastIndexOf(".") > url.lastIndexOf("/")) {
    if (verbose)
      console.log(`[cannot fall back to index: client requests a file with extension] ${req.method} ${req.url}`);
    return false;
  }

  if (verbose) console.log(`[can fall back to index] ${req.method} ${req.url}`);
  return true;
}

function canStatic(req, verbose = false) {
  const { method } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    if (verbose) console.log(`[cannot fall back to static: method is not GET or HEAD] ${req.method} ${req.url}`);
    return false;
  }

  if (verbose) console.log(`[can fall back to static] ${req.method} ${req.url}`);
  return true;
}

function normalizePath(p) {
  if (!p.startsWith("/")) {
    return "/" + p;
  }

  return p;
}
