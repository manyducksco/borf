import { $Node } from "./$Node";
import {
  parseRoute,
  matchRoute,
  sortedRoutes,
  joinPath,
  FragTypes,
} from "../routing/Router";
import { makeDolla } from "./Dolla";

/**
 * Creates a router outlet for a nested route. Multiple routes
 * are attached and the best match is displayed at this element's position.
 */
export class $Route extends $Node {
  static get isComponent() {
    return true;
  }

  #routes = [];
  #outlet;
  #mounted;
  #cancellers = [];
  #path;
  #getInjectables;

  path;
  route;
  params;
  query;
  wildcard;
  index = -1;

  get isConnected() {
    return this.#outlet && this.#outlet.isConnected;
  }

  constructor(element, path) {
    super();

    this.#path = path;
    this.createElement = () => {
      return element();
    };
  }

  when(route, ...handlers) {
    const entry = {
      fragments: parseRoute(route),
      handlers,
    };

    this.#routes.push(entry);

    return this;
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#outlet = this.createElement();
    }

    const onRouteChanged = () => {
      const matched = matchRoute(this.#routes, this.#path);

      console.log(matched, this.#path, this.#routes);

      if (matched) {
        if (matched.path !== this.#path) {
          this.#mountRoute(matched);
        }
      } else {
        console.warn(
          `No route was matched. Consider adding a wildcard ("*") route to catch this.`
        );
      }
    };

    this.#routes = sortedRoutes(this.#routes);
    this.#outlet.connect(parent, after);

    onRouteChanged();

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.#outlet.disconnect();

      for (const cancel of this.#cancellers) {
        cancel();
      }
    }
  }

  #mountRoute(matched) {
    this.path = matched.path;
    this.route = matched.route;
    this.params = matched.params;
    this.query = matched.query;
    this.wildcard = matched.wildcard;
    this.index = -1;

    const { app, http } = this.#getInjectables();
    const $ = makeDolla({
      app,
      http,
      router: this,
      getInjectables: this.#getInjectables,
    });

    const next = () => {
      if (matched.handlers[this.index + 1]) {
        let handler = matched.handlers[++this.index];
        let result;

        if (isFunction(handler)) {
          if (handler.isDolla) {
            result = handler();
          } else {
            result = handler($, { app, http, next });
          }
        }

        if (result instanceof $Node) {
          requestAnimationFrame(() => {
            if (this.#mounted) {
              this.#mounted.disconnect();
            }
            this.#mounted = result;
            this.#mounted.connect(this.#outlet.element);
          });
        } else if (result !== undefined) {
          throw new TypeError(
            `Route handlers must be a Component, $(element) or function that returns an $(element). Received: ${result}`
          );
        }
      } else {
        if (this.index === 0) {
          throw new Error(`Route has no handler function.`);
        } else {
          throw new Error(
            `Route called .next() but there is no handler after it.`
          );
        }
      }
    };

    next();
  }
}
