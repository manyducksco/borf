import { makeService } from "../makeService.js";
import { isFunction, isObject, isString } from "../helpers/typeChecking.js";

export default makeService((self) => {
  self.debug.name = "woof:@http";

  const _middleware = [];
  let fetch = self.options.fetch || window.fetch.bind(window);
  let requestId = 0;

  function request(method, url) {
    return new HTTPRequest({
      id: ++requestId,
      method,
      url,
      fetch,
      middleware: _middleware,
      debug: self.debug,
    });
  }

  return {
    request,

    use(...middleware) {
      _middleware.push(...middleware);

      return this;
    },

    get(url) {
      return request("get", url);
    },

    put(url) {
      return request("put", url);
    },

    patch(url) {
      return request("patch", url);
    },

    post(url) {
      return request("post", url);
    },

    delete(url) {
      return request("delete", url);
    },

    head(url) {
      return request("head", url);
    },
  };
});

export class HTTPRequest {
  #id;
  #debug;
  #url;
  #query;
  #ctx;
  #res;
  #middleware;
  #fetch;
  #parse;
  #serialize;
  #promise;
  #isOk;

  #contentTypeAuto = true; // disabled when header is explicitly set

  constructor({ id, debug, method, url, middleware, fetch }) {
    const [path, query] = url.split("?");

    this.#id = id;
    this.#debug = debug;
    this.#url = path;
    this.#middleware = middleware;
    this.#fetch = fetch;
    this.#query = new URLSearchParams(query || "");
    this.#ctx = {
      method,
      headers: new Headers(),
      body: undefined,
    };
    this.#isOk = (status) => status >= 200 && status < 300;
  }

  /**
   * True if this request's URL is a relative path (same domain).
   */
  get isRelative() {
    return !/^https?\:\/\//.test(this.#url);
  }

  /**
   * Gets or sets the URL for this request.
   */
  url(value) {
    if (value === undefined) {
      return this.#url;
    } else if (isString(value)) {
      this.#url = value;
    } else {
      throw new TypeError(`Expected a string. Received: ${value}`);
    }
  }

  /**
   * Sets headers to send with the request.
   *
   * @example
   * // Set a single header
   * .header("content-type", "application/json")
   *
   * // Remove a header
   * .header("content-type", null)
   *
   * // Get a header's current value
   * .header("content-type")
   *
   * // Set multiple headers
   * .header({
   *   "content-type": "application/json",
   *   "authorization": "bearer acbdef"
   * })
   *
   * @param header - Header name or object with multiple headers.
   * @param value - Value to set if passing header name, otherwise undefined.
   */
  header(header, value) {
    if (isString(header)) {
      // Return header's current value
      if (value === undefined) {
        return this.#ctx.headers.get(header);
      }

      if (header.toLowerCase() === "content-type") {
        this.#contentTypeAuto = false;
      }

      // Remove header
      if (value === null) {
        this.#ctx.headers.delete(header);
        return this;
      }

      // Set header to value
      this.#ctx.headers.set(header, value.toString());

      return this;
    } else if (isObject(header) && value == null) {
      // Set an object full of keys and values
      for (const key in header) {
        this.header(key, header[key]);
      }
      return this;
    }

    throw new Error(`Expected a key and value, an object, or a header name only. Received: ${header} and ${value}`);
  }

  /**
   * Sets headers to be sent with the request. Alias for `.header(header, value)`.
   */
  headers(header, value) {
    this.header(header, value);
    return this;
  }

  query(query, value) {
    if (isString(query)) {
      // Return query param's current value
      if (value === undefined) {
        return this.#query.get(query);
      }

      // Remove query param
      if (value === null) {
        this.#query.delete(query);
        return this;
      }

      // Set query param to value
      this.#query.set(query, value.toString());

      return this;
    } else if (isObject(query) && value == null) {
      // Set an object full of keys and values
      for (const key in query) {
        this.query(key, query[key]);
      }
      return this;
    }

    throw new Error(`Expected a key and value, an object, or a parameter name only. Received: ${query} and ${value}`);
  }

  body(value) {
    if (isObject(value)) {
      if (this.#contentTypeAuto) {
        this.header("content-type", "application/json");
      }
      this.#ctx.body = JSON.stringify(value);
    } else if (value instanceof FormData) {
      if (this.#contentTypeAuto) {
        this.header("content-type", "application/x-www-form-urlencoded");
      }
      this.#ctx.body = value;
    } else {
      this.#ctx.body = value;
    }

    return this;
  }

  /**
   * Takes a function to determine whether a response is a success or an error.
   *
   * @param fn - Takes the status code and returns true if response is successful or false if it should be treated as an error.
   */
  ok(fn) {
    this.#isOk = fn;
  }

  response() {
    return this.#res;
  }

  /**
   * Sends the request.
   */
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

  async #send() {
    const res = {
      status: 200,
      statusText: "OK",
      headers: {},
      body: undefined,
    };

    this.#res = res;

    const handler = async () => {
      this.#debug.log(`[request:${this.#id}] ${this.#ctx.method.toUpperCase()} ${this.#url}`);
      const start = Date.now();

      const query = this.#query.toString();
      const url = query.length > 0 ? this.#url + "?" + query : this.#url;

      const fetched = await this.#fetch(url, this.#ctx);

      res.status = fetched.status;
      res.statusText = fetched.statusText;
      fetched.headers.forEach((value, key) => {
        res.headers[key] = value;
      });

      const contentType = res.headers["content-type"];

      if (isFunction(this.#parse)) {
        res.body = await this.#parse(fetched);
      } else if (contentType?.includes("application/json")) {
        res.body = await fetched.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        res.body = await fetched.formData();
      } else {
        res.body = await fetched.text();
      }

      this.#debug.log(
        `[response:${this.#id}] ${this.#ctx.method.toUpperCase()} ${this.#url}`,
        `(+${Math.round(Date.now() - start)}ms)`,
        res
      );
    };

    const mount = (index = 0) => {
      const current = this.#middleware[index];
      const next = this.#middleware[index + 1] ? mount(index + 1) : handler;

      return async () => current(this, next);
    };

    if (this.#middleware.length > 0) {
      await mount()();
    } else {
      await handler();
    }

    // Throw non-OK response codes as errors to force explicit handling.
    // With fetch's req.ok way there are two error handling paths; response errors (then) and network errors (catch).
    // In most cases, a 404 or 500 is the same as a network error from the app's point of view.
    // If needed, the .ok() function can control what is thrown as an error.
    if (this.#isOk(res.status) == false) {
      const err = new HTTPError(
        `${res.status} ${res.statusText}: Request failed (${this.#ctx.method.toUpperCase()} ${this.#url})`
      );
      err.method = this.#ctx.method;
      err.url = this.#url;
      err.status = res.status;
      err.statusText = res.statusText;
      err.headers = res.headers;
      err.body = res.body;

      throw err;
    }

    return res;
  }
}

class HTTPError extends Error {
  method;
  url;
  status;
  statusText;
  headers;
  body;
}
