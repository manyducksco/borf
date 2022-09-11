import fs from "fs";
import path from "path";
import send from "send";
import { isObject, isString, isTemplate } from "./helpers/typeChecking.js";
import { matchRoute } from "./helpers/routing.js";
import { parseFormBody } from "./helpers/parseFormBody.js";
import { EventSource } from "./objects/EventSource.js";
import { Request } from "./objects/Request.js";
import { Response } from "./objects/Response.js";
import { Headers } from "./objects/Headers.js";

const mime = send.mime;

/**
 * Returns a request handler callback for a node `http` server.
 */
export function makeListener(appContext) {
  return async function requestListener(req, res) {
    const { routes, services, middlewares, cors } = appContext;
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
      if (matched.data.staticDirectory) {
        console.log("static", matched, { url: req.url });

        const stream = send(req, matched.params.wildcard, {
          root: matched.data.staticDirectory,
          maxage: 0,
        });

        stream.on("error", function onError(err) {
          res.writeHead(err.status);
          res.end();
        });

        stream.pipe(res);
        return;
      }

      const request = new Request(req, matched);
      const response = new Response();
      response.headers = headers;

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

        const next = index === handlers.length - 1 ? undefined : nextFunc;
        ctx.response.body = (await current(ctx, next)) || ctx.response.body;
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

      if (ctx.response.body && ctx.response.body instanceof EventSource) {
        ctx.response.body.start(res);
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
    } else {
      // Try serving static files, otherwise return 404.
      if (req.method === "GET" || req.method === "HEAD") {
        // TODO: Probably avoid reading from disk to check for fallback.
        const staticPath = fs.existsSync(appContext.staticPath) ? path.resolve(appContext.staticPath) : null;
        const hasIndexHTML = staticPath && fs.existsSync(path.join(staticPath, "index.html"));

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
