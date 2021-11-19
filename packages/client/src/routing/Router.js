import {
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
} from "history";
import queryString from "query-string";
import catchLinks from "../_helpers/catchLinks";
import { isFunction, isString } from "../_helpers/typeChecking";
import { $Node } from "../templating/$Node";
import { makeDolla } from "../templating/Dolla";
import { createRouter, sortedRoutes, parseRoute, joinPath } from "./utils";

export class Router {
  #basePath = "";
  #routes = [];
  #cancellers = [];
  #outlet;
  #mounted;
  #getInjectables;
  #history;
  #router = createRouter();

  matched;

  constructor(options = {}, getInjectables) {
    this.#getInjectables = getInjectables;

    if (options.history) {
      this.#history = options.history;
    } else if (options.hash) {
      this.#history = createHashHistory();
    } else {
      this.#history = createBrowserHistory();
    }

    if (options.basePath) {
      this.#basePath = options.basePath;
    }
  }

  /**
   * Registers a new route and its handler function(s).
   *
   * @param route - Path string (like '/example/:id/edit')
   * @param handlers - One or more route handler functions
   */
  on(route, ...handlers) {
    const entry = {
      fragments: parseRoute(route),
      handlers,
    };

    this.#routes = sortedRoutes([...this.#routes, entry]);
  }

  /**
   * Navigates to another route or traverses navigation history with a number of steps.
   *
   * @example
   * router.navigate(-1);
   * router.navigate(2);
   * router.navigate("/other/path");
   * router.navigate("/other/path", { replace: true });
   *
   * @param to - Path string or number of history entries
   * @param options - `replace: true` to replace state
   */
  navigate(to, options = {}) {
    if (typeof to === "number") {
      this.#history.go(to);
    } else if (typeof to === "string") {
      if (options.replace) {
        this.#history.replace(to);
      } else {
        this.#history.push(to);
      }
    } else {
      throw new TypeError(
        `Expected a number or string but received ${typeof to}`
      );
    }
  }

  /**
   * Starts routing, rendering the current route component into the `outlet` element.
   *
   * @param outlet - Target DOM node for selector string for routes to be rendered into
   */
  connect(outlet) {
    let node;

    if (isString(outlet)) {
      node = document.querySelector(outlet);
    } else {
      node = outlet;
    }

    if (node == null) {
      throw new Error(`Outlet was not found.`);
    }

    this.#outlet = node;
    this.#outlet.setAttribute(
      "data-router-outlet",
      joinPath(this.#basePath, "*")
    );

    const onRouteChanged = ({ location }) => {
      const route = Router.match(location.pathname + location.search);

      const matched = matchRoute(
        this.#routes,
        location.pathname,
        location.search
      );

      if (matched) {
        if (
          !this.matched ||
          matched.path !== this.matched.path ||
          matched.query !== this.matched.query
        ) {
          this.#mountRoute(matched);
        }
      } else {
        console.warn(
          `No route was matched. Consider adding a wildcard ("*") route to catch this.`
        );
      }
    };

    this.#cancellers.push(this.#history.listen(onRouteChanged));
    this.#cancellers.push(
      catchLinks(node, (anchor) => {
        const href = anchor.getAttribute("href");

        // TODO: Handle relative links

        this.#history.push(href);
      })
    );

    // Do initial match
    onRouteChanged(this.#history);
  }

  disconnect() {
    this.#outlet.removeAttribute("data-router-outlet");

    for (const cancel of this.#cancellers) {
      cancel();
    }
  }

  #mountRoute(matched) {
    this.index = -1;
    this.matched = matched;

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
          if (this.#mounted) {
            this.#mounted.disconnect();
          }
          this.#mounted = result;
          this.#mounted.connect(this.#outlet);
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
