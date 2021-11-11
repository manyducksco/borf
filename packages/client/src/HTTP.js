import { state } from "./state";
import { isFunction, isObject } from "./utils/typeChecking";

export class HTTP {
  #middleware = [];

  request(method, url, ...args) {
    const { middleware, options } = this.#parseArgs(args);

    return new HTTPRequest(method, url, options, [
      ...middleware,
      ...this.#middleware,
    ]);
  }

  use(...middleware) {
    this.#middleware.push(...middleware);
  }

  get(url, ...args) {
    return this.request("get", url, ...args);
  }

  put(url, ...args) {
    return this.request("put", url, ...args);
  }

  patch(url, ...args) {
    return this.request("patch", url, ...args);
  }

  post(url, ...args) {
    return this.request("post", url, ...args);
  }

  delete(url, ...args) {
    return this.request("delete", url, ...args);
  }

  #parseArgs(args) {
    const lastArg = args[args.length - 1];

    for (const arg of args) {
      if (arg !== lastArg) {
        if (!isFunction(arg)) {
          throw new TypeError(
            `Expecting middleware function but got ${typeof arg}`
          );
        }
      }
    }

    let middleware = [];
    let options = {};

    if (isObject(lastArg)) {
      options = args.pop();
    }

    middleware = args;

    return { middleware, options };
  }
}

export class HTTPRequest {
  #method;
  #url;
  #options;
  #middleware;

  isLoading = state(false);
  isSuccess = state(false);
  isError = state(false);
  body = state(null);

  constructor(method, url, options, middleware) {
    this.#method = method;
    this.#url = url;
    this.#options = options;
    this.#middleware = middleware;

    this.refresh();
  }

  async refresh() {
    this.isLoading(true);

    const ctx = {
      ok: true,
      url: this.#url,
      headers: {},
      status: undefined,
      body: undefined,
    };

    const handler = async () => {
      const res = await fetch(this.#url, {
        method: this.#method,
        headers: ctx.headers,
        body: ctx.body,
      });

      ctx.ok = res.ok;
      ctx.status = res.status;
      res.headers.forEach((value, key) => {
        ctx.headers[key] = value;
      });

      if (ctx.headers["content-type"] === "application/json") {
        ctx.body = await res.json();
      } else {
        ctx.body = await res.text();
      }
    };

    const wrapMiddleware = (index) => {
      const current = this.#middleware[index];
      const next = this.#middleware[index + 1]
        ? wrapMiddleware(index + 1)
        : handler;

      return async () => current(ctx, next);
    };

    if (this.#middleware.length > 0) {
      await wrapMiddleware(0)();
    } else {
      await handler();
    }

    this.isLoading(false);
    this.body(ctx.body);

    if (ctx.status && ctx.status >= 200 && ctx.status < 400) {
      this.isSuccess(true);
      this.isError(false);
    } else {
      this.isSuccess(false);
      this.isError(true);
    }
  }
}
