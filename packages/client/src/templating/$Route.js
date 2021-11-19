import { $Node } from "./$Node";
import {
  parseRoute,
  matchRoute,
  sortedRoutes,
  joinPath,
  FragTypes,
} from "../routing/utils";
import { makeDolla } from "./Dolla";
import { isFunction } from "../_helpers/typeChecking";

/**
 * TODO:
 * - $.route() returns a $Route node
 * - $Route node registers a listener when mounted; receives the wildcard portion of the nearest route up
 * - When route changes, matching cascades:
 *   - Top level router matches, tests first level subroutes
 *   - When subroute matches, it tests its subroutes
 * - Each $.route() needs to create its own matching context
 */

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

  mounted;
  index = -1;

  get isConnected() {
    return this.#outlet && this.#outlet.isConnected;
  }

  constructor(element, path, getInjectables) {
    super();

    this.#path = path;
    this.#getInjectables = getInjectables;
    this.createElement = () => {
      return element();
    };
  }

  when(route, ...handlers) {
    const entry = {
      fragments: parseRoute(route),
      handlers,
    };

    this.#routes = sortedRoutes([...this.#routes, entry]);

    return this;
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#outlet = this.createElement();
    }

    const matched = matchRoute(this.#routes, this.#path);

    if (matched) {
      if (this.mounted == null || matched.path !== this.mounted.path) {
        this.#mountRoute(matched);
      }
    } else {
      console.warn(
        `No route was matched. Consider adding a wildcard ("*") route to catch this.`
      );
    }

    this.#outlet.connect(parent, after);

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
    this.mounted = matched;
    this.index = -1;

    const { app, http } = this.#getInjectables();
    const $ = makeDolla({ app, http, route: matched });

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
