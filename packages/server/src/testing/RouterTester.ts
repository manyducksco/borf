import { IncomingMessage, ServerResponse, IncomingHttpHeaders } from "node:http";
import { Socket } from "node:net";
import { type Stream } from "node:stream";
import { isFunction, isObject, isString, typeOf } from "@borf/bedrock";
import { Router } from "../classes/Router.js";
import { DebugChannel, DebugHub } from "../classes/DebugHub.js";
import { CrashCollector } from "../classes/CrashCollector.js";
import { NoCache } from "../classes/StaticCache.js";
import { Request } from "../classes/Request.js";
import { Response } from "../classes/Response.js";
import { Headers } from "../classes/Headers.js";
import { makeStore, type Store } from "../component.js";
import { isHTML, render } from "../html.js";
import { type HandlerContext } from "../classes/App/makeRequestListener.js";
import { type AppContext, type StoreRegistration } from "../classes/App/App.js";

export type RequestOptions<Body> = {
  /**
   * Body to send with the request.
   */
  body?: Body;

  /**
   * Headers to send with the request.
   */
  headers?: Record<string, string | number | boolean> | Headers;

  /**
   * Query params to interpolate into the URL.
   */
  query?: Record<string, string | number | boolean> | URLSearchParams;
};

export class RouterTester {
  #appContext: AppContext;
  #stores = new Map<Store<any, any>, StoreRegistration<any>>([]);
  #router;

  #initialized = false;

  constructor(router: Router) {
    this.#router = router;

    const debugHub = new DebugHub();
    const crashCollector = new CrashCollector({
      onCrash: (entry) => {},
      onReport: (entry) => {},
      sendStackTrace: true,
    });

    this.#appContext = {
      debugHub,
      crashCollector,
      staticCache: new NoCache(),
      stores: this.#stores,
      mode: "development",
    };
  }

  /**
   * Injects a new store that will be accessible in this Router's request handlers.
   */
  store<A>(config: StoreRegistration<A>): this;

  /**
   * Injects a new store that will be accessible in this Router's request handlers.
   */
  store<A>(store: Store<A, any>, attributes?: A): this;

  store<A>(store: Store<any, any> | StoreRegistration<any>, attributes?: A) {
    if (isFunction(store)) {
      this.#stores.set(store, { store, attributes });
    } else if (isObject(store)) {
      this.#stores.set((store as StoreRegistration<A>).store, store as StoreRegistration<A>);
    } else {
      throw new TypeError(`Expected a store function or config object. Got type: ${typeOf(store)}, value: ${store}`);
    }

    return this;
  }

  /**
   * Makes a GET request to `path`.
   */
  async get(path: string, options?: RequestOptions<any>) {
    return this.#request("GET", path, options);
  }

  /**
   * Makes a PUT request to `path`.
   */
  async put(path: string, options?: RequestOptions<any>) {
    return this.#request("PUT", path, options);
  }

  /**
   * Makes a PATCH request to `path`.
   */
  async patch(path: string, options?: RequestOptions<any>) {
    return this.#request("PATCH", path, options);
  }

  /**
   * Makes a GET request to `path`.
   */
  async post(path: string, options?: RequestOptions<any>) {
    return this.#request("POST", path, options);
  }

  /**
   * Makes a DELETE request to `path`.
   */
  async delete(path: string, options?: RequestOptions<any>) {
    return this.#request("DELETE", path, options);
  }

  /**
   * Makes a HEAD request to `path`.
   */
  async head(path: string, options?: RequestOptions<any>) {
    return this.#request("HEAD", path, options);
  }

  /**
   * Makes a OPTIONS request to `path`.
   */
  async options(path: string, options?: RequestOptions<any>) {
    return this.#request("OPTIONS", path, options);
  }

  /**
   * Makes a TRACE request to `path`.
   */
  async trace(path: string, options?: RequestOptions<any>) {
    return this.#request("TRACE", path, options);
  }

  // Initializes stores.
  async #init() {
    if (this.#initialized) {
      return;
    }

    for (const config of this.#stores.values()) {
      const instance = makeStore({
        appContext: this.#appContext,
        store: config.inject ?? config.store,
        attributes: config.attributes ?? {},
      });

      config.instance = instance;
      await instance.connect();
    }

    this.#initialized = true;
  }

  async #request<ResBody = unknown, ReqBody = unknown>(verb: string, path: string, options?: RequestOptions<ReqBody>) {
    if (!this.#initialized) {
      await this.#init();
    }

    if (options?.query) {
      let query: URLSearchParams;

      if (options.query instanceof URLSearchParams) {
        query = options.query;
      } else {
        query = new URLSearchParams();
        for (const key in options.query) {
          query.set(key, String(options.query[key]));
        }
      }

      if (path.includes("?")) {
        path += "&" + options.query.toString();
      } else {
        path += "?" + options.query.toString();
      }
    }

    const match = this.#router.matchRoute(verb, path);

    if (match) {
      const appContext = this.#appContext;
      const socket = new Socket();

      const req = new IncomingMessage(socket);
      const res = new ServerResponse(req);

      req.url = path;
      req.method = verb;

      if (options?.headers) {
        let headers: Record<string, string> = {};

        if (options.headers instanceof Headers) {
          headers = options.headers.toJSON();
        } else {
          for (const key in options.headers) {
            headers[key] = String(options.headers[key]);
          }
        }

        for (const key in headers) {
          req.headers[key] = headers[key];
        }
      }

      const parsedBody: ReqBody | undefined = options?.body;

      const ctx: Omit<HandlerContext, keyof DebugChannel> = {
        cache: {},
        req: new Request(req, match, parsedBody),
        res: new Response<any>({}),
        use<T extends Store<any, any>>(store: T): ReturnType<T> extends Promise<infer U> ? U : ReturnType<T> {
          if (appContext.stores.has(store)) {
            return appContext.stores.get(store)?.instance!.exports as any;
          }

          throw new Error(`Store '${store.name}' is not registered on this app.`);
        },
      };

      const debugChannel = appContext.debugHub.channel({ name: `${req.method?.toUpperCase()} ${req.url}` });

      Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(debugChannel));

      let index = -1;
      // TODO: Inject app-level middleware.
      const handlers = [...match.meta.handlers];

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
          ctx.res.body = await render(ctx.res.body, { appContext });
        } else if (isString(ctx.res.body)) {
          ctx.res.headers.set("content-type", "text/plain");
        } else if (isFunction((ctx.res.body as any).pipe)) {
          // Is a stream; handled below
          bodyIsStream = true;
        } else if (!ctx.res.headers.has("content-type") && isObject(ctx.res.body)) {
          ctx.res.headers.set("content-type", "application/json");
          ctx.res.body = ctx.res.body;
        }
      }

      if (bodyIsStream) {
        throw new Error(`TODO: Streaming bodies are not yet supported by RouterTester.`);
        // (ctx.res.body as Stream).pipe(res);
      }

      return ctx.res.toJSON();
    } else {
      const res = new Response({});
      res.status = 404;
      return res;
    }
  }
}
