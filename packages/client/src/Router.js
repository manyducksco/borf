import { createBrowserHistory, createHashHistory } from "history";
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
    this.#routes.push({
      fragments: parseRoute(route),
      handlers,
    });

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

    this.#routes = sortedRoutes(this.#routes);
    this.#outlet = node;
    this.#outlet.setAttribute(
      "data-router-outlet",
      this.#joinPath(this.#basePath, "*")
    );

    const onRouteChanged = ({ location }) => {
      const matched = matchRoute(
        this.#routes,
        location.pathname,
        location.search
      );

      if (matched) {
        if (matched.path !== this.path || matched.query !== this.query) {
          this.#mountRoute(matched);
        }
      } else {
        console.warn(
          `No route was matched. Consider adding a wildcard ("*") route to catch this.`
        );
      }
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

  #mountRoute(matched) {
    let handlerIndex = -1;

    this.path = matched.path;
    this.route = matched.route;
    this.params = matched.params;
    this.query = matched.query;

    const { $, app, http } = this.#getInjectables();

    const next = () => {
      if (matched.handlers[handlerIndex + 1]) {
        let result = matched.handlers[++handlerIndex]($, { app, http, next });

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

/**
 * Route matching strategy:
 *
 * 1. Parse route string into an array of segments
 * 2. Order routes by most specific to least specific
 * 3. Match path against each route in descending order, returning on the first match
 */

export const FragTypes = {
  Literal: 1,
  Param: 2,
  Wildcard: 3,
};

export function splitFragments(path) {
  return path
    .split("/")
    .map((f) => f.trim())
    .filter((f) => f !== "");
}

/**
 *
 */
export function parseRoute(route) {
  const parts = splitFragments(route);
  const parsed = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === "*") {
      if (i !== parts.length - 1) {
        throw new Error(
          `Wildcard must be at the end of a route. Received: ${route}`
        );
      }
      parsed.push({
        type: FragTypes.Wildcard,
        name: "*",
        value: null,
      });
    } else if (part[0] === ":") {
      parsed.push({
        type: FragTypes.Param,
        name: part.slice(1),
        value: null,
      });
    } else {
      parsed.push({
        type: FragTypes.Literal,
        name: part,
        value: part,
      });
    }
  }

  return parsed;
}

export function matchRoute(routes, path, query) {
  const parts = splitFragments(path);

  routes: for (const route of routes) {
    const { fragments, handlers } = route;
    const hasWildcard =
      fragments[fragments.length - 1]?.type === FragTypes.Wildcard;

    if (!hasWildcard && fragments.length !== parts.length) {
      continue routes;
    }

    const matched = [];

    route: for (let i = 0; i < fragments.length; i++) {
      const part = parts[i];
      const frag = fragments[i];

      if (part == null && frag.type !== FragTypes.Wildcard) {
        continue routes;
      }

      switch (frag.type) {
        case FragTypes.Literal:
          if (frag.value.toLowerCase() === part.toLowerCase()) {
            matched.push(frag);
            break;
          } else {
            continue routes;
          }
        case FragTypes.Param:
          matched.push({ ...frag, value: part });
          break;
        case FragTypes.Wildcard:
          matched.push({ ...frag, value: parts.slice(i).join("/") });
          break route;
        default:
          throw new Error(`Unknown fragment type: ${frag.type}`);
      }
    }

    const params = Object.create(null);

    for (const frag of matched) {
      if (frag.type === FragTypes.Param) {
        params[frag.name] = frag.value;
      }

      if (frag.type === FragTypes.Wildcard) {
        params.wildcard = frag.value;
      }
    }

    return {
      path: matched.map((f) => f.value).join("/"),
      route: fragments
        .map((f) => (f.type === FragTypes.Param ? ":" + f.name : f.name))
        .join("/"),
      params,
      query: query ? queryString.parse(query) : {},
      handlers: handlers,
    };
  }
}

/**
 * Sorts routes in order of specificity.
 * Routes without params and longer routes are weighted more heavily.
 */
export function sortedRoutes(routes) {
  const withParams = [];
  const withoutParams = [];

  for (const route of routes) {
    if (route.fragments.some((f) => f.type === FragTypes.Param)) {
      withParams.push(route);
    } else {
      withoutParams.push(route);
    }
  }

  withParams.sort((a, b) => {
    if (a.length > b.length) {
      return -1;
    } else {
      return 1;
    }
  });

  withoutParams.sort((a, b) => {
    if (a.length > b.length) {
      return -1;
    } else {
      return 1;
    }
  });

  return [...withoutParams, ...withParams];
}
