import HTTP from "../main/services/@http";
import { createRouter } from "../_helpers/routing";
import { flatMap } from "../_helpers/flatMap";

/**
 * Creates a mocked HTTP service with custom responses defined by you.
 *
 * @example
 * import { MockHTTP, wrapComponent } from "@manyducksco/woof/test";
 *
 * // Create a mock HTTP instance
 * const http = new MockHTTP();
 *
 * // Define a mock response
 * http.get("/example/route", (req, res, ctx) => {
 *   return res(ctx.json({
 *     message: "success"
 *   }))
 * });
 *
 * // Add mocked http service to a wrapped service or component
 * const createComponent = wrapComponent(ExampleComponent).service("@http", http.service);
 */
export class MockHTTP {
  #router = createRouter();

  calls = []; // stores one object for each HTTP call made since .reset() was called

  reset() {
    this.calls = [];
  }

  get service() {
    const fetch = this.#fetch.bind(this);

    return class extends HTTP {
      _created(options) {
        super._created({
          ...options,
          fetch,
        });
      }
    };
  }

  /**
   * Registers a new mock response handler for a GET request.
   */
  get(url, responder) {
    this.#router.on(url, {
      method: "get",
      responder,
    });

    return this;
  }

  /**
   * Registers a new mock response handler for a PUT request.
   */
  put(url, responder) {
    this.#router.on(url, {
      method: "put",
      responder,
    });

    return this;
  }

  /**
   * Registers a new mock response handler for a PATCH request.
   */
  patch(url, responder) {
    this.#router.on(url, {
      method: "patch",
      responder,
    });

    return this;
  }

  /**
   * Registers a new mock response handler for a POST request.
   */
  post(url, responder) {
    this.#router.on(url, {
      method: "post",
      responder,
    });

    return this;
  }

  /**
   * Registers a new mock response handler for a DELETE request.
   */
  delete(url, responder) {
    this.#router.on(url, {
      method: "delete",
      responder,
    });

    return this;
  }

  async #fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      const method = (options.method || "get").toLowerCase();
      const matched = this.#router.match(url, {
        filter: (route) => {
          return route.attributes.method === method;
        },
      });

      if (matched == null) {
        throw new Error(
          `Requested URL has no handlers. Received: ${method.toUpperCase()} ${url}`
        );
      }

      const headers = {};
      let body;

      if (options.headers) {
        for (const entry of options.headers.entries()) {
          headers[entry[0]] = entry[1];
        }
      }

      if (options.body) {
        if (headers["content-type"] === "application/json") {
          body = JSON.parse(options.body);
        } else {
          body = options.body;
        }
      }

      const req = {
        method,
        url,
        headers,
        body,
        params: matched.params,
        query: matched.query,
      };

      this.calls.push(req);

      const res = (...fields) => {
        const ctx = {
          status: 200,
          body: undefined,
          headers: {},
        };

        flatMap(fields).forEach(({ field, value }) => {
          switch (field) {
            case "headers":
              Object.assign(ctx.headers, value);
              break;
            default:
              ctx[field] = value;
              break;
          }
        });

        resolve(
          new Response(ctx.body, {
            headers: ctx.headers,
            status: ctx.status,
          })
        );
      };

      if (matched) {
        const { responder } = matched.attributes;

        responder(req, res, this.#createContext());
      } else {
        resolve(
          new Response(null, {
            status: 404,
          })
        );
      }
    });
  }

  #createContext() {
    return {
      json(value) {
        return [
          {
            field: "headers",
            value: { "Content-Type": "application/json" },
          },
          {
            field: "body",
            value: JSON.stringify(value),
          },
        ];
      },
      headers(...args) {
        let value = {};

        if (args.length === 1) {
          value = args[0]; // object with multiple headers
        }

        if (args.length === 2) {
          value[args[0]] = args[1]; // key and value
        }

        return [
          {
            field: "headers",
            value,
          },
        ];
      },
      status(code) {
        return [
          {
            field: "status",
            value: code,
          },
        ];
      },
    };
  }
}
