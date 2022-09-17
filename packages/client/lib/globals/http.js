import { isFunction, isObject, isString } from "../helpers/typeChecking.js";
import { APP_CONTEXT } from "../keys.js";
import { makeGlobal } from "../makers/makeGlobal.js";

export default makeGlobal((ctx) => {
  const _middleware = [];
  const fetch = ctx[APP_CONTEXT].options.http?._fetch || window.fetch.bind(window); // Accepts a _fetch option in the app context options for mocking.
  let requestId = 0;

  const request = (method, url) => {
    return makeRequest({
      id: ++requestId,
      method,
      url,
      fetch,
      log: ctx.log,
      middleware: _middleware,
    });
  };

  const methods = {
    request,

    use(...middleware) {
      _middleware.push(...middleware);
      return methods;
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

  return methods;
});

function makeRequest({ id, log, method, url, middleware, fetch }) {
  const [path, query] = url.split("?");
  const queryParams = new URLSearchParams(query || "");

  const ctx = {
    method,
    headers: new Headers(),
    body: undefined,
  };

  let isOk = (status) => status >= 200 && status < 300;
  let parse;
  let contentTypeAuto = true;
  let promise;

  let res;

  async function send() {
    res = {
      status: 200,
      statusText: "OK",
      headers: {},
      body: undefined,
    };

    const handler = async () => {
      log(`[#${id}] sent ${ctx.method.toUpperCase()} request to '${url}'`);
      const start = Date.now();

      const query = queryParams.toString();
      const fullUrl = queryParams.length > 0 ? url + "?" + query : url;

      const fetched = await fetch(fullUrl, ctx);

      res.status = fetched.status;
      res.statusText = fetched.statusText;
      fetched.headers.forEach((value, key) => {
        res.headers[key] = value;
      });

      const contentType = res.headers["content-type"];

      if (isFunction(parse)) {
        res.body = await parse(fetched);
      } else if (contentType?.includes("application/json")) {
        res.body = await fetched.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        res.body = await fetched.formData();
      } else {
        res.body = await fetched.text();
      }

      log(
        `[#${id}] got response from ${ctx.method.toUpperCase()} '${fullUrl}'`,
        `(took ${Math.round(Date.now() - start)}ms)`,
        res
      );
    };

    const mount = (index = 0) => {
      const current = middleware[index];
      const next = middleware[index + 1] ? mount(index + 1) : handler;

      return async () => current(methods, next);
    };

    if (middleware.length > 0) {
      await mount()();
    } else {
      await handler();
    }

    // Throw non-OK response codes as errors to force explicit handling.
    // With fetch's req.ok way there are two error handling paths; response errors (then) and network errors (catch).
    // In most cases, a 404 or 500 is the same as a network error from the app's point of view.
    // If needed, the .ok() function can control what is thrown as an error.
    if (!isOk(res.status)) {
      const err = new HTTPError(`${res.status} ${res.statusText}: Request failed (${ctx.method.toUpperCase()} ${url})`);
      err.method = ctx.method;
      err.url = url;
      err.status = res.status;
      err.statusText = res.statusText;
      err.headers = res.headers;
      err.body = res.body;

      throw err;
    }

    return res;
  }

  const methods = {
    /**
     * True if this request's URL is a relative path (same domain).
     */
    isRelative() {
      return !/^https?:\/\//.test(url);
    },

    /**
     * Gets or sets the URL for this request.
     */
    url(value) {
      if (value === undefined) {
        return url;
      } else if (isString(value)) {
        url = value;
      } else {
        throw new TypeError(`Expected a string. Received: ${value}`);
      }
    },

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
          return ctx.headers.get(header);
        }

        if (header.toLowerCase() === "content-type") {
          contentTypeAuto = false;
        }

        // Remove header
        if (value === null) {
          ctx.headers.delete(header);
          return methods;
        }

        // Set header to value
        ctx.headers.set(header, value.toString());

        return methods;
      } else if (isObject(header) && value == null) {
        // Set an object full of keys and values
        for (const key in header) {
          methods.header(key, header[key]);
        }
        return methods;
      }

      throw new Error(`Expected a key and value, an object, or a header name only. Received: ${header} and ${value}`);
    },

    /**
     * Sets headers to be sent with the request. Alias for `.header(header, value)`.
     */
    headers(header, value) {
      methods.header(header, value);
      return methods;
    },

    query(query, value) {
      if (isString(query)) {
        // Return query param's current value
        if (value === undefined) {
          return queryParams.get(query);
        }

        // Remove query param
        if (value === null) {
          queryParams.delete(query);
          return methods;
        }

        // Set query param to value
        queryParams.set(query, value.toString());

        return methods;
      } else if (isObject(query) && value == null) {
        // Set an object full of keys and values
        for (const key in query) {
          methods.query(key, query[key]);
        }
        return methods;
      }

      throw new Error(`Expected a key and value, an object, or a parameter name only. Received: ${query} and ${value}`);
    },

    body(value) {
      if (value instanceof FormData) {
        if (contentTypeAuto) {
          methods.header("content-type", "application/x-www-form-urlencoded");
        }
        ctx.body = value;
      } else if (isObject(value)) {
        if (contentTypeAuto) {
          methods.header("content-type", "application/json");
        }
        ctx.body = JSON.stringify(value);
      } else {
        ctx.body = value;
      }

      return methods;
    },

    /**
     * Takes a function to determine whether a response is a success or an error.
     *
     * @param fn - Takes the status code and returns true if response is successful or false if it should be treated as an error.
     */
    ok(fn) {
      isOk = fn;
      return methods;
    },

    response() {
      return res;
    },

    /**
     * Sends the request.
     */
    then(...args) {
      if (!promise) {
        promise = send();
      }

      return promise.then(...args);
    },

    catch(...args) {
      if (!promise) {
        promise = send();
      }

      return promise.catch(...args);
    },

    finally(...args) {
      if (!promise) {
        promise = send();
      }

      return promise.finally(...args);
    },
  };

  return methods;
}

class HTTPError extends Error {
  method;
  url;
  status;
  statusText;
  headers;
  body;
}
