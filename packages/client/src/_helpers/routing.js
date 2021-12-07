import queryString from "query-string";

/*===============================*\
||         ROUTING TOOLS         ||
\*===============================*/

export const FragTypes = {
  Literal: 1,
  Param: 2,
  Wildcard: 3,
};

/**
 * Creates a generic router that registers and matches routes.
 */
export function createRouter(options) {
  let routes = [];

  return {
    /**
     * Defines a route with optional attributes.
     */
    on(path, attributes) {
      const parsed = parseRoute(path);
      const entry = {
        fragments: parsed.fragments,
        attributes,
      };

      routes = sortedRoutes([...routes, entry]);

      return this;
    },
    /**
     * Matches the path against registered routes. Returns the route if matched or null otherwise.
     *
     * Pass a `filter` function in options to decide if potential matches are the final match. Receives the matched route and returns `true` or `false`.
     *
     * @param path - Path to match
     * @param options -
     */
    match(path, options = {}) {
      const [main, query] = path.split("?");
      const { filter } = options;

      return matchRoute(routes, main, query, filter);
    },
  };
}

/**
 * Separates a URL path into multiple fragments.
 *
 * @param path - A path string (e.g. `"/api/users/5"`)
 * @returns an array of fragments (e.g. `["api", "users", "5"]`)
 */
export function splitPath(path) {
  return path
    .split("/")
    .map((f) => f.trim())
    .filter((f) => f !== "");
}

/**
 * Joins multiple URL path fragments into a single string.
 *
 * @param parts - One or more URL fragments (e.g. `["api", "users", 5]`)
 * @returns a joined path (e.g. `"api/users/5"`)
 */
export function joinPath(...parts) {
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

/**
 * Converts a route string into a matchable route object.
 *
 * @param route - A route string (e.g. "/api/users/:id")
 */
export function parseRoute(route) {
  const parts = splitPath(route);
  const fragments = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === "*") {
      if (i !== parts.length - 1) {
        throw new Error(
          `Wildcard must be at the end of a route. Received: ${route}`
        );
      }
      fragments.push({
        type: FragTypes.Wildcard,
        name: "*",
        value: null,
      });
    } else if (part[0] === ":") {
      fragments.push({
        type: FragTypes.Param,
        name: part.slice(1),
        value: null,
      });
    } else {
      fragments.push({
        type: FragTypes.Literal,
        name: part,
        value: part,
      });
    }
  }

  return { fragments };
}

/**
 * Match a path against a list of parsed routes. Returns metadata for the matched route, or undefined if no match is found.
 *
 * @param routes - Array of parsed routes.
 * @param path - String to match against routes.
 * @param query - Query string parameters to parse.
 * @param filter - Function for final say on matching. Receives matched route and returns true or false.
 */
export function matchRoute(routes, path, query, filter) {
  const parts = splitPath(path);

  routes: for (const route of routes) {
    const { fragments } = route;
    const hasWildcard =
      fragments[fragments.length - 1]?.type === FragTypes.Wildcard;

    if (!hasWildcard && fragments.length !== parts.length) {
      continue routes;
    }

    const matched = [];

    fragments: for (let i = 0; i < fragments.length; i++) {
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
          break fragments;
        default:
          throw new Error(`Unknown fragment type: ${frag.type}`);
      }
    }

    const params = Object.create(null);
    let wildcard = false;

    for (const frag of matched) {
      if (frag.type === FragTypes.Param) {
        params[frag.name] = frag.value;
      }

      if (frag.type === FragTypes.Wildcard) {
        wildcard = true;
        params.wildcard = frag.value;
      }
    }

    const routeInfo = {
      ...route,
      path: matched.map((f) => f.value).join("/"),
      route: fragments
        .map((f) => (f.type === FragTypes.Param ? ":" + f.name : f.name))
        .join("/"),
      params,
      query: query ? queryString.parse(query) : Object.create(null),
      wildcard,
    };

    if (filter == null || filter(routeInfo)) {
      return routeInfo;
    }
  }
}

/**
 * Sorts routes in order of specificity.
 * Routes without params and routes with more fragments are weighted more heavily.
 */
export function sortedRoutes(routes) {
  const withoutParams = [];
  const withParams = [];
  const wildcard = [];

  for (const route of routes) {
    if (route.fragments.some((f) => f.type === FragTypes.Wildcard)) {
      wildcard.push(route);
    } else if (route.fragments.some((f) => f.type === FragTypes.Param)) {
      withParams.push(route);
    } else {
      withoutParams.push(route);
    }
  }

  const bySizeDesc = (a, b) => {
    if (a.fragments.length > b.fragments.length) {
      return -1;
    } else {
      return 1;
    }
  };

  withoutParams.sort(bySizeDesc);
  withParams.sort(bySizeDesc);
  wildcard.sort(bySizeDesc);

  return [...withoutParams, ...withParams, ...wildcard];
}
