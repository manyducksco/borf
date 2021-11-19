import { state } from "./state";
import { isFunction, isObject } from "../_helpers/typeChecking";

export class HTTP {
  #middleware = [];
  #fetch;

  constructor(options = {}) {
    if (options.fetch) {
      this.#fetch = options.fetch;
    }
  }

  request(method, url, ...args) {
    const { middleware, options } = this.#parseArgs(args);

    return new HTTPRequest({
      method,
      url,
      options,
      middleware: [...middleware, ...this.#middleware],
      fetch: this.#fetch || window.fetch,
    });
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
            `Expected a middleware function. Received: ${arg}`
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
  #promise;
  #fetch;

  isLoading = state(false);
  isSuccess = state(false);
  isError = state(false);
  status = state(null);
  body = state(null);
  headers = state(null);

  constructor({ method, url, options, middleware, fetch }) {
    this.#method = method;
    this.#url = url;
    this.#options = options;
    this.#middleware = middleware;
    this.#fetch = fetch;

    this.refresh();
  }

  then(...args) {
    return this.#promise.then(...args);
  }

  catch(...args) {
    return this.#promise.catch(...args);
  }

  finally(...args) {
    return this.#promise.finally(...args);
  }

  async refresh() {
    this.isLoading(true);

    this.#promise = new Promise((resolve, reject) => {
      this.isLoading((status, cancel) => {
        if (status == false) {
          cancel();

          if (this.isSuccess()) {
            resolve(this.body());
          } else {
            reject(this.body());
          }
        }
      });
    });

    const ctx = {
      ok: true,
      url: this.#url,
      headers: {},
      status: undefined,
      body: undefined,
    };

    const handler = async () => {
      const res = await this.#fetch(this.#url, {
        method: this.#method,
        headers: ctx.headers,
        body: ctx.body,
      });

      ctx.ok = res.ok;
      ctx.status = res.status;
      res.headers.forEach((value, key) => {
        ctx.headers[key] = value;
      });

      if (isFunction(this.#options.parse)) {
        ctx.body = await this.#options.parse(ctx, res);
      } else if (ctx.headers["content-type"] === "application/json") {
        ctx.body = await res.json();
      } else {
        ctx.body = await res.text();
      }
    };

    const mount = (index = 0) => {
      const current = this.#middleware[index];
      const next = this.#middleware[index + 1] ? mount(index + 1) : handler;

      return async () => current(ctx, next);
    };

    if (this.#middleware.length > 0) {
      await mount()();
    } else {
      await handler();
    }

    this.status(ctx.status);
    this.headers(ctx.headers);
    this.body(ctx.body);

    if (ctx.status && ctx.status >= 200 && ctx.status < 400) {
      this.isError(false);
      this.isSuccess(true);
    } else {
      this.isError(true);
      this.isSuccess(false);
    }

    this.isLoading(false);
  }
}
