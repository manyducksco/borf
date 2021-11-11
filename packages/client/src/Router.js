import { createHashHistory, createBrowserHistory } from "history";
import { match } from "path-to-regexp";
import queryString from "query-string";
import catchLinks from "./utils/catchLinks";
import { isFunction, isString } from "./utils/typeChecking";
import { $Node } from "./$Node";

export class Router {
  #basePath = "";
  #routes = [];
  #cancellers = [];
  #outlet;
  #mounted;
  #getInjectables;

  history;
  path;
  route;
  params = {};
  query = {};

  constructor(options = {}, getInjectables) {
    this.#getInjectables = getInjectables;

    if (options.history) {
      this.history = options.history;
    } else if (options.hash) {
      this.history = createHashHistory();
    } else {
      this.history = createBrowserHistory();
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
    if (route.trim() === "*") {
      this.#routes.push({
        path: "*",
        handlers,
        match: (path) => {},
      });
    } else {
      const path = this.#joinPath(this.#basePath, this.#normalizePath(route));
      this.#routes.push({
        path,
        handlers,
        match: match(path, {
          decode: decodeURIComponent,
        }),
      });
    }

    return this;
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
      this.history.go(to);
    } else if (typeof to === "string") {
      if (options.replace) {
        this.history.replace(to);
      } else {
        this.history.push(to);
      }
    } else {
      throw new TypeError(
        `Expected a number or string as the first parameter but received ${typeof to}`
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
      this.#joinPath(this.#basePath, "*")
    );

    const onRouteChanged = ({ location }) => {
      this.#matchRoute(location.pathname + location.search);
    };

    this.#cancellers.push(this.history.listen(onRouteChanged));
    this.#cancellers.push(
      catchLinks(node, (anchor) => {
        const href = anchor.getAttribute("href");
        this.history.push(href);
      })
    );

    // Do initial match
    onRouteChanged(this.history);
  }

  disconnect() {
    this.#outlet.removeAttribute("data-router-outlet");

    for (const cancel of this.#cancellers) {
      cancel();
    }
  }

  #normalizePath(path) {
    if (path[0] !== "/") {
      path = "/" + path;
    }

    return path;
  }

  /**
   * Joins several path fragments into a single string.
   */
  #joinPath(...parts) {
    parts = parts.filter((x) => x);

    let joined = parts.shift();

    if (joined) {
      for (const part of parts) {
        if (joined[joined.length - 1] !== "/") {
          if (part[0] !== "/") {
            joined += "/" + part;
          } else {
            joined += part;
          }
        }
      }
    }

    return joined ?? "";
  }

  #matchRoute(href) {
    const target = queryString.parseUrl(href);

    if (this.#basePath) {
      const basePath = this.#joinPath(this.#basePath, "(.*)?");

      if (!match(basePath)(target.url)) {
        return;
      }
    }

    let wildcard;

    for (const route of this.#routes) {
      if (!wildcard && route.path === "*") {
        wildcard = route;
        continue;
      }

      const matched = route.match(target.url);

      if (matched) {
        this.#initRoute(target, route, matched);
        return;
      }
    }

    if (wildcard) {
      this.#initRoute(target, wildcard, {
        path: target.url,
        index: 0,
        params: {},
      });
    }
  }

  #initRoute(target, route, matched) {
    let handlerIndex = -1;

    this.path = matched.path;
    this.route = route.path;
    this.params = matched.params;
    this.query = target.query;

    const { $, app, http } = this.#getInjectables();

    const next = () => {
      if (route.handlers[handlerIndex + 1]) {
        handlerIndex++;
        let result = route.handlers[handlerIndex]({ $, app, http, next });

        if (result.isComponent) {
          result = $(result);
        }

        if (isFunction(result) && result.isDolla) {
          result = result();
        }

        if (result instanceof $Node) {
          requestAnimationFrame(() => {
            if (this.#mounted) {
              this.#mounted.disconnect();
            }
            this.#mounted = result;
            this.#mounted.connect(this.#outlet);
          });
        } else if (result !== undefined) {
          throw new TypeError(
            `Route handler returned ${typeof result} but expected a $Node or undefined.`
          );
        }
      } else {
        if (handlerIndex === 0) {
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
