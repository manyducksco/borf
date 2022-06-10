export const FragTypes = {
  Literal: 1,
  Param: 2,
  Wildcard: 3,
};

/**
 * Separates a URL path into multiple fragments.
 *
 * @param path - A path string (e.g. `"/api/users/5"`)
 * @returns an array of fragments (e.g. `["api", "users", "5"]`)
 */
export function splitRoute(path) {
  return path
    .split("/")
    .map((f) => f.trim())
    .filter((f) => f !== "");
}

/**
 * Converts a route string into a matchable route object.
 *
 * @param route - A route string (e.g. "/api/users/:id")
 */
export function parseRoute(route) {
  const parts = splitRoute(route);
  const fragments = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === "*") {
      if (i !== parts.length - 1) {
        throw new Error(`Wildcard must be at the end of a route. Received: ${route}`);
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
 */
export function matchRoute(routes, path) {
  const parts = splitRoute(path);

  routes: for (const route of routes) {
    const { fragments } = route;
    const hasWildcard = fragments[fragments.length - 1]?.type === FragTypes.Wildcard;

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
      route: fragments.map((f) => (f.type === FragTypes.Param ? ":" + f.name : f.name)).join("/"),
      params,
      props: route.props,
    };
  }
}

/**
 * Sorts routes in order of specificity.
 * Routes without params and routes with more fragments are weighted more heavily.
 */
export function sortRoutes(routes) {
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
