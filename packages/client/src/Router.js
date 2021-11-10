import { createHashHistory, createBrowserHistory } from "history";
import { match } from "path-to-regexp";
import queryString from "query-string";
import catchLinks from "./utils/catchLinks";
import { isString } from "./utils/typeChecking";
import { Component } from "./Component";

export class Router {
  #basePath = "";
  #routes = [];
  #cancellers = [];
  #outlet = null;
  #mountedComponent = null;
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
   * @param route - path string (like '/example/:id/edit')
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

  navigate() {}

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

    // const injectables = this.#getInjectables();

    const injectables = {
      ...this.#getInjectables(),
      $: () => alert("Not Yet"),
      next,
    };

    function next() {
      if (route.handlers[handlerIndex + 1]) {
        handlerIndex++;
        const result = route.handlers[handlerIndex](injectables);

        if (result instanceof Component) {
          // Mount the component
          requestAnimationFrame(() => {
            if (this.#mountedComponent) {
              this.#mountedComponent.disconnect();
            }

            this.#mountedComponent = result;
            this.#mountedComponent.connect(this.#outlet);
          });
        } else if (result !== undefined) {
          throw new TypeError(
            `Route handler returned ${typeof result} but expected a component or undefined.`
          );
          // Keep current component
          // console.log("not mounting any component");
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
    }

    next();
  }
}
