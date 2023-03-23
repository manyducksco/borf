import type { IncomingMessage, RequestListener } from "node:http";
import type { AppContext } from "./App";
import type { DebugChannel } from "classes/DebugHub";
import type { StoreConstructor, StoreRegistration } from "classes/Store";

import path from "node:path";
import send from "send";
import { Type } from "@borf/bedrock";
import { Router } from "../Router.js";
import { Request } from "../Request.js";
import { Response } from "../Response.js";
import { Headers } from "../Headers.js";
import { isHTML } from "../../html.js";

export type { RequestListener };

export interface RequestContext {
  useStore<S extends StoreConstructor<unknown>, E = S extends StoreConstructor<infer U> ? U : unknown>(store: S): E;
  request: Request;
  response: Response;
  redirect(to: string, statusCode?: number): void;
  next?: () => void;
}

// Server router store is initialized per request.
// const router = ctx.useStore("router");

// router.pattern;
// router.params;
// router.query;
// router.redirect("/path");

export function makeRequestListener(appContext: AppContext, router: Router): RequestListener {
  return async function listener(req, res) {
    const { corsOptions } = appContext;
    const channel = appContext.debugHub.channel("borf:server");
    const headers = new Headers();

    /**
     * Configure CORS headers based on options.
     */

    if (corsOptions) {
      // set these headers for both preflight and normal requests
      if (corsOptions.allowOrigin.includes("*")) {
        headers.set("access-control-allow-origin", "*");
      } else {
        headers.set(
          "access-control-allow-origin",
          req.headers.origin && corsOptions.allowOrigin.includes(req.headers.origin) ? req.headers.origin : false
        );
        headers.append("vary", "Origin");
      }

      if (corsOptions.allowCredentials) {
        headers.set("access-control-allow-credentials", "true");
      }

      if (corsOptions.exposeHeaders) {
        headers.set("access-control-expose-headers", corsOptions.exposeHeaders.join(", "));
      }

      if (req.method === "OPTIONS") {
        // preflight
        headers.set("access-control-allow-methods", corsOptions.allowMethods.join(", "));

        if (corsOptions.allowHeaders) {
          headers.set("access-control-allow-headers", corsOptions.allowHeaders.join(", "));
        } else if (req.headers["access-control-request-headers"]) {
          headers.set("access-control-allow-headers", req.headers["access-control-request-headers"]);
          headers.append("vary", "Access-Control-Request-Headers");
        }

        if (corsOptions.maxAge) {
          headers.set("access-control-max-age", corsOptions.maxAge);
        }

        headers.set("content-length", "0");
        res.writeHead(204, headers.toJSON());
        res.end();
        return;
      }
    }

    /**
     * Match request against registered routes.
     */

    const matched = router.matchRoute(req.method!, req.url!);

    if (matched) {
      // Initialize request-lifecycle stores.
      const requestStores = new Map<StoreConstructor<unknown>, StoreRegistration<unknown>>();

      // TODO: First the built-ins (router, etc.)

      // Then the user stores
      for (const config of appContext.stores.values()) {
        if (config.lifecycle === "request") {
          const instance = new config.store({
            appContext,
            label: config.store.label || config.store.name,
            lifecycle: config.lifecycle,
          });

          requestStores.set(config.store, {
            ...config,
            instance,
          });

          await instance.connect();
        }
      }

      // Disconnect stores after response is finished.
      res.once("close", async () => {
        for (const config of requestStores.values()) {
          await config.instance!.disconnect();
        }
      });

      const request = new Request(req, matched);
      const response = new Response({ headers });

      const ctx: RequestContext = {
        // cache: {}, // TODO: Users can make a request-lifecycle store for this.

        useStore<S extends StoreConstructor<unknown>, E = S extends StoreConstructor<infer U> ? U : unknown>(
          store: S
        ): E {
          // Try request-lifecycle stores.
          if (requestStores.has(store)) {
            return requestStores.get(store)?.instance!.exports as E;
          }

          // Fall back to app-lifecycle stores.
          if (appContext.stores.has(store)) {
            return appContext.stores.get(store)?.instance!.exports as E;
          }

          throw new Error(`Store '${name}' is not registered on this app.`);
        },

        request,
        response,

        redirect(to: string, statusCode = 301) {
          response.status = statusCode;
          response.headers.set("Location", to);
        },
      };

      let index = -1;
      // TODO: Inject app-level middleware.
      const handlers = [...matched.meta.handlers];

      const nextFunc = async () => {
        index++;
        let current = handlers[index];

        ctx.next = index === handlers.length - 1 ? undefined : nextFunc;
        ctx.response.body = (await current(ctx)) || ctx.response.body;
      };

      try {
        await nextFunc();
      } catch (err) {
        if (Type.isString(err)) {
          err = new Error(err);
        }

        if (err instanceof Error) {
          ctx.response.status = 500;
          ctx.response.body = {
            error: {
              message: err.message,
              stack: err.stack,
            },
          };
        }

        console.error(err);
      }

      let bodyIsStream = false;

      // Automatically handle content-type and body formatting when returned from handler function.
      if (ctx.response.body) {
        if (isHTML(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/html");
          ctx.response.body = await ctx.response.body.render();
        } else if (Type.isString(ctx.response.body)) {
          ctx.response.headers.set("content-type", "text/plain");
        } else if (Type.isFunction(ctx.response.body.pipe)) {
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
    } else if (!canServeStatic(req, channel)) {
      res.writeHead(404, { ...headers.toJSON(), "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found." }));
    } else {
      req.url = normalizePath(req.url!);

      let fallback = appContext.fallback ? normalizePath(appContext.fallback) : null;
      let match = appContext.staticCache.get(req.url);

      if (fallback && canServeFallback(req, channel)) {
        match = appContext.staticCache.get(fallback);
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

      Object.entries(headers.toJSON()).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      send(req, filePath).pipe(res);
    }
  };
}

/**
 * Determines if this route is eligible for a fallback `index.html` if no routes match.
 */
function canServeFallback(req: IncomingMessage, channel: DebugChannel) {
  const { method, headers } = req;
  const url = req.url!; // TODO: Would this actually be undefined in any situation where this runs? Types say it can be.

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    channel.log(`Cannot fall back to index: method is not GET or HEAD (${req.method} ${req.url})`);
    return false;
  }

  // Accept header is not sent.
  if (!Type.isString(headers.accept)) {
    channel.log(`Cannot fall back to index: no "Accept" header was sent (${req.method} ${req.url})`);
    return false;
  }

  // Client prefers JSON.
  if (headers.accept.startsWith("application/json")) {
    channel.log(`Cannot fall back to index: client prefers JSON (${req.method} ${req.url})`);
    return false;
  }

  // Client doesn't accept HTML.
  if (!headers.accept.startsWith("text/html") && !headers.accept.startsWith("*/*")) {
    channel.log(`Cannot fall back to index: client doesn't accept HTML (${req.method} ${req.url})`);
    return false;
  }

  // Client is requesting file with an extension.
  if (url.lastIndexOf(".") > url.lastIndexOf("/")) {
    channel.log(`Cannot fall back to index: client requests a file with extension (${req.method} ${req.url})`);
    return false;
  }

  channel.log(`Can fall back to index (${req.method} ${req.url})`);
  return true;
}

/**
 * Determines if this route is eligible to try static files if no routes match.
 */
function canServeStatic(req: IncomingMessage, channel: DebugChannel) {
  const { method } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    channel.log(`Cannot fall back to static: method is not GET or HEAD (${req.method} ${req.url})`);
    return false;
  }

  channel.log(`Can fall back to static (${req.method} ${req.url})`);
  return true;
}

function normalizePath(p: string) {
  if (!p.startsWith("/")) {
    return "/" + p;
  }

  return p;
}
