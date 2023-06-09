import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import type { Stream } from "node:stream";
import type { AppContext } from "./App";
import type { DebugChannel } from "../DebugHub";

import path from "node:path";
import fs from "node:fs";
import send from "send";
import { type RouteMatch, isFunction, isString } from "@borf/bedrock";
import { Router } from "../Router.js";
import { Request } from "../Request.js";
import { Response } from "../Response.js";
import { Headers } from "../Headers.js";
import { isHTML, render } from "../../html.js";
import { parseBody } from "../../helpers/parseBody.js";
import { type Store } from "../../component.js";

export type { RequestListener };

/**
 * The object passed to request handlers.
 */
export interface HandlerContext<ReqBody = any> extends DebugChannel {
  cache: Record<string | number | symbol, unknown>;
  req: Request<ReqBody>;
  res: Response<any>;
  use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>;

  /**
   * Respond with a static file.
   */
  file(path: string): void;
}

export function makeRequestListener(appContext: AppContext, router: Router): RequestListener {
  return async function listener(req, res) {
    const { corsOptions } = appContext;
    const channel = appContext.debugHub.channel({ name: "borf:server" });
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

    if (matched && matched.pattern !== "/*") {
      // Skip '/*' fallback handler; it is used after every other type of handling fails.
      await handleMatchedRequest(appContext, req, res, matched, headers);
    } else if (!canServeStatic(req, channel)) {
      if (matched && matched.pattern === "/*") {
        // Use '/*' fallback handler
        await handleMatchedRequest(appContext, req, res, matched, headers);
      } else {
        res.writeHead(404, { ...headers.toJSON(), "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Route not found." }));
      }
    } else {
      req.url = normalizePath(req.url!);

      let fallback = appContext.fallback ? normalizePath(appContext.fallback) : null;
      let match = appContext.staticCache.get(req.url);



      if (fallback && canServeFallback(req, channel)) {
        match = appContext.staticCache.get(fallback);
      }

      // Attempt to fall back to index.html if one exists
      if (!match && req.url === "/") {
        match = appContext.staticCache.get("/index.html");
      }

      console.log({ fallback, match, url: req.url });

      if (!match) {
        if (matched && matched.pattern === "/*") {
          // Use '/*' fallback handler
          await handleMatchedRequest(appContext, req, res, matched, headers);
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Route not found." }));
        }
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
    channel.info(`Cannot fall back to index: method is not GET or HEAD (${req.method} ${req.url})`);
    return false;
  }

  // Accept header is not sent.
  if (!isString(headers.accept)) {
    channel.info(`Cannot fall back to index: no "Accept" header was sent (${req.method} ${req.url})`);
    return false;
  }

  // Client prefers JSON.
  if (headers.accept.startsWith("application/json")) {
    channel.info(`Cannot fall back to index: client prefers JSON (${req.method} ${req.url})`);
    return false;
  }

  // Client doesn't accept HTML.
  if (!headers.accept.startsWith("text/html") && !headers.accept.startsWith("*/*")) {
    channel.info(`Cannot fall back to index: client doesn't accept HTML (${req.method} ${req.url})`);
    return false;
  }

  // Client is requesting file with an extension.
  if (url.lastIndexOf(".") > url.lastIndexOf("/")) {
    channel.info(`Cannot fall back to index: client requests a file with extension (${req.method} ${req.url})`);
    return false;
  }

  channel.info(`Can fall back to index (${req.method} ${req.url})`);
  return true;
}

/**
 * Determines if this route is eligible to try static files if no routes match.
 */
function canServeStatic(req: IncomingMessage, channel: DebugChannel) {
  const { method } = req;

  // Method is not GET or HEAD.
  if (method !== "GET" && method !== "HEAD") {
    channel.info(`Cannot fall back to static: method is not GET or HEAD (${req.method} ${req.url})`);
    return false;
  }

  channel.info(`Can fall back to static (${req.method} ${req.url})`);
  return true;
}

function normalizePath(p: string) {
  if (!p.startsWith("/")) {
    return "/" + p;
  }

  return p;
}

export async function handleMatchedRequest(
  appContext: AppContext,
  req: IncomingMessage,
  res: ServerResponse,
  matched: RouteMatch,
  headers?: Headers
) {
  const parsedBody = await parseBody(req);

  const ctx: Omit<HandlerContext, keyof DebugChannel> = {
    cache: {},
    req: new Request(req, matched, parsedBody),
    res: new Response<any>({ headers }),
    use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T> {
      if (appContext.stores.has(store)) {
        return appContext.stores.get(store)?.instance!.exports as any;
      }

      throw new Error(`Store '${store.name}' is not registered on this app.`);
    },
    file(pathname: string) {
      // TODO: Check static directories if relative, otherwise serve file directly.
      // Set headers based on file metadata. Use the send package if possible.
      pathname = normalizePath(pathname);
      const file = appContext.staticCache.get(pathname);

      if (file) {
        const fullPath = path.join(file.source, file.path);
        ctx.res.headers.set("content-type", file.type ?? "application/octet-stream");
        ctx.res.body = fs.createReadStream(fullPath);
      } else {
        ctx.res.status = 404;
      }
    },
    // json(object: any) {

    // },
    // html(template: string) {

    // }
  };

  const debugChannel = appContext.debugHub.channel({ name: `${req.method?.toUpperCase()} ${req.url}` });

  Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debugChannel));

  let index = -1;
  // TODO: Inject app-level middleware.
  const handlers = [...matched.meta.handlers];

  const nextFunc = async () => {
    index++;
    const current = handlers[index];
    const next = index === handlers.length - 1 ? () => Promise.resolve() : nextFunc;

    ctx.res.body = (await current(ctx as HandlerContext, next)) || ctx.res.body;

    return ctx.res.body;
  };

  try {
    await nextFunc();
  } catch (err) {
    if (isString(err)) {
      err = new Error(err);
    }

    if (err instanceof Error) {
      ctx.res.status = 500;
      ctx.res.body = {
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
  if (ctx.res.body != null) {
    if (isHTML(ctx.res.body)) {
      ctx.res.headers.set("content-type", "text/html");
      ctx.res.body = "<!DOCTYPE html>" + (await render(ctx.res.body, { appContext }));
    } else if (isString(ctx.res.body)) {
      ctx.res.headers.set("content-type", "text/plain");
    } else if (isFunction((ctx.res.body as any).pipe)) {
      // Is a stream; handled below
      bodyIsStream = true;
    } else if (!ctx.res.headers.has("content-type")) {
      ctx.res.headers.set("content-type", "application/json");
      ctx.res.body = JSON.stringify(ctx.res.body);
    }
  }

  res.writeHead(ctx.res.status, ctx.res.headers.toJSON());

  if (bodyIsStream) {
    (ctx.res.body as Stream).pipe(res);
  } else {
    if (ctx.res.body != null) {
      res.write(Buffer.from(ctx.res.body as Buffer | string | any[]));
    }

    res.end();
  }
}
