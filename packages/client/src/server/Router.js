import { isString } from "../_helpers/typeChecking";
import { makeRouter } from "@woofjs/router";

export class Router {
  get isRouter() {
    return true;
  }

  #router = makeRouter();

  /**
   * Mounts a Resource at a given path.
   */
  resource(path, resource) {}

  /**
   * Defines a route with a handler function.
   */
  route(method, path, ...handlers) {
    this.#router.on(path, { callback: () => {} });
  }

  get(path, ...handlers) {
    this.route("get", path, ...handlers);
  }

  put(path, ...handlers) {
    this.route("put", path, ...handlers);
  }

  post(path, ...handlers) {
    this.route("post", path, ...handlers);
  }

  patch(path, ...handlers) {
    this.route("patch", path, ...handlers);
  }

  delete(path, ...handlers) {
    this.route("delete", path, ...handlers);
  }

  mount(...args) {
    if (args.length === 2) {
      const [path, router] = args;

      if (isString(path) && router.isRouter) {
        // mount at path
      }
    } else if (args.length === 1) {
      const [router] = args;

      if (router.isRouter) {
        // Merge routes from subrouter
        this.#router.merge(router.$routes());
      }
    }

    throw new Error(`Expected a router or a path and a router. Received: ${args.join(", ")}`);
  }

  $match(method, path) {
    return this.#router.match(path, {
      willMatch: (route) => {
        console.log(route);
      },
    });
  }

  $routes() {
    return this.#router.routes();
  }
}
