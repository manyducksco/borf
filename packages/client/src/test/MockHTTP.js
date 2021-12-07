import HTTP from "../services/@http";
import { createRouter } from "../_helpers/routing";
import { flatMap } from "../_helpers/flatMap";
import { isFunction } from "../_helpers/typeChecking";

/**
 * Creates a mocked HTTP service with custom responses defined by you.
 *
 * @example
 * import { MockHTTP, wrap } from "@manyducksco/woof/test";
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
 * const createComponent = wrap(ExampleComponent).service("@http", http.service);
 */
export class MockHTTP {
  #router = createRouter();

  calls = []; // stores one object for each HTTP call made since .reset() was called

  reset() {
    this.calls = [];
  }

  service = (getService) => {
    const http = new HTTP(getService);
    const _created = http._created.bind(http);

    // Override created callback to inject fetch override.
    http._created = (options) => {
      if (isFunction)
        _created({
          fetch: (...args) => this.#fetch(...args),
          ...options,
        });
    };

    return http;
  };

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

  async #fetch(path, options = {}) {
    return new Promise((resolve, reject) => {
      const method = (options.method || "get").toLowerCase();
      const matched = this.#router.match(path, {
        filter: (route) => {
          return route.attributes.method === method;
        },
      });

      this.calls.push({
        method,
        url: path,
        params: matched.params,
        headers: options.headers || {},
      });

      const req = {};

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
