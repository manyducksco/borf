import { Store } from "../classes/Store.js";
import { isObject, isFunction } from "../helpers/typeChecking.js";

export class HTTPStore extends Store {
  static about = "A nice HTTP client that auto-parses responses and supports middleware.";

  static attrs = {
    fetch: {
      about: "The fetch function to use for requests. Pass this to mock for testing.",
      type: "function",
      default: (window ?? global).fetch?.bind(window ?? global),
    },
  };

  setup(ctx) {
    const { fetch } = ctx.attrs.get();

    const _middleware = [];
    let requestId = 0;

    const request = (method, url, options) => {
      return new HTTPRequest({
        id: ++requestId,
        method,
        url,
        fetch,
        log: ctx.log,
        middleware: _middleware,
        options,
      });
    };

    return {
      request,

      use(...middleware) {
        _middleware.push(...middleware);
        return this;
      },

      get(url, options) {
        return request("get", url, options);
      },

      put(url, options) {
        return request("put", url, options);
      },

      patch(url, options) {
        return request("patch", url, options);
      },

      post(url, options) {
        return request("post", url, options);
      },

      delete(url, options) {
        return request("delete", url, options);
      },

      head(url, options) {
        return request("head", url, options);
      },
    };
  }
}

class HTTPRequest {
  #id;
  #method;
  #url;
  #query;
  #headers = new Headers();
  #body;
  #middleware;
  #parse;
  #checkOk = (res) => res.status >= 200 && res.status < 300;

  #promise;
  #response;

  #fetch;
  #log;

  constructor({ id, method, url, fetch, log, middleware, options }) {
    const [_url, query] = url.split("?");

    this.#id = id;
    this.#method = method;
    this.#url = _url;
    this.#query = new URLSearchParams(query || "");
    this.#fetch = fetch;
    this.#log = log;
    this.#middleware = middleware;

    if (options) {
      if (!isObject(options)) {
        throw new TypeError(`Options must be an object. Got: ${options}`);
      }

      if (options.query) {
        this.setQuery(options.query);
      }

      if (options.headers) {
        this.setHeaders(options.headers);
      }

      if (options.body) {
        this.setBody(options.body);
      }
    }
  }

  get isSameDomain() {
    return !/^https?:\/\//.test(this.#url);
  }

  getMethod() {
    return this.#method;
  }

  setMethod() {
    if (this.#promise) {
      throw new Error(`Method can't be changed because the request has already been sent.`);
    }

    return this;
  }

  getURL() {
    return this.#url;
  }

  setURL(url) {
    if (this.#promise) {
      throw new Error(`URL can't be changed because the request has already been sent.`);
    }

    this.#url = url;
    return this;
  }

  getHeader(name) {
    return this.#headers.get(name);
  }

  setHeader(name, value) {
    if (this.#promise) {
      throw new Error(`Headers can't be changed because the request has already been sent.`);
    }

    this.#headers.set(name, value);
    return this;
  }

  getHeaders() {
    return Object.fromEntries(this.#headers.entries());
  }

  setHeaders(headers) {
    if (this.#promise) {
      throw new Error(`Headers can't be changed because the request has already been sent.`);
    }

    for (const name in headers) {
      this.#headers.set(name, headers[name]);
    }
    return this;
  }

  getBody() {
    return this.#body;
  }

  setBody(data) {
    if (this.#promise) {
      throw new Error(`Body can't be changed because the request has already been sent.`);
    }

    this.#body = data;
    return this;
  }

  getQuery(name) {
    if (name) {
      if (!isString(name)) {
        throw new TypeError(`Query param name must be a string. Got: ${name}`);
      }
      return this.#query.get(name);
    } else {
      return Object.fromEntries(this.#query.entries());
    }
  }

  setQuery(...args) {
    if (this.#promise) {
      throw new Error(`Query params can't be changed because the request has already been sent.`);
    }

    const params = {};

    if (args.length === 1 && isObject(args[0])) {
      Object.assign(params, args[0]);
    } else if (args.length === 2 && isString(args[0])) {
      const [name, value] = args;
      this.#query.set(name, value);
    } else {
      throw new TypeError(`Expected an object or a key and value. Got: ${args}`);
    }

    return this;
  }

  checkOk(fn) {
    this.#checkOk = fn;
    return this;
  }

  getResponse() {
    return this.#response;
  }

  async #send() {
    const res = HTTPResponse.fromRequest(this);

    const handler = async () => {
      this.#log(`[#${this.#id}] sent request to ${this.#method.toUpperCase()} '${this.#url}'`);
      const start = Date.now();
      const query = this.#query.toString();
      const fullURL = this.#query.length > 0 ? this.#url + "?" + query : this.#url;

      const fetched = await this.#fetch(fullURL, {
        method: this.#method,
        headers: this.#headers,
        body: this.#body,
      });

      res.status = fetched.status;
      res.statusText = fetched.statusText;
      res.headers = Object.fromEntries(fetched.headers.entries());

      const contentType = res.headers["content-type"];

      if (isFunction(this.#parse)) {
        res.body = await parse(fetched);
      } else if (contentType?.includes("application/json")) {
        res.body = await fetched.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        res.body = await fetched.formData();
      } else {
        res.body = await fetched.text();
      }

      this.#log(
        `[#${this.#id}] got response from ${this.#method.toUpperCase()} '${fullURL}'`,
        `(took ${Math.round(Date.now() - start)}ms)`,
        res
      );
    };

    if (this.#middleware.length > 0) {
      const mount = (index = 0) => {
        const current = this.#middleware[index];
        const next = this.#middleware[index + 1] ? mount(index + 1) : handler;

        return async () => current(this, next);
      };

      await mount()();
    } else {
      await handler();
    }

    if (!this.#checkOk(res)) {
      throw new HTTPResponseError(res);
    }

    this.#response = res;
    return res;
  }

  then(...args) {
    if (!this.#promise) {
      this.#promise = this.#send();
    }

    return this.#promise.then(...args);
  }

  catch(...args) {
    if (!this.#promise) {
      this.#promise = this.#send();
    }

    return this.#promise.catch(...args);
  }

  finally(...args) {
    if (!this.#promise) {
      this.#promise = this.#send();
    }

    return this.#promise.finally(...args);
  }
}

class HTTPResponse {
  method;
  url;
  status = 200;
  statusText = "OK";
  headers = {};
  body;

  static fromRequest(request) {
    const res = new HTTPResponse();

    res.method = request.getMethod();
    res.url = request.getURL();

    return res;
  }
}

class HTTPResponseError extends Error {
  response;

  constructor(response) {
    const { status, statusText, method, url } = response;
    const message = `${status} ${statusText}: Request failed (${method.toUpperCase()} ${url})`;

    super(message);

    this.response = response;
  }
}
