export type RouteMatch<T = Record<string, any>> = {
  /**
   * The path string that triggered this match.
   */
  path: string;

  /**
   * The pattern satisfied by `path`.
   */
  pattern: string;

  /**
   * Named params as parsed from `path`.
   */
  params: Record<string, string | number>;

  /**
   * Query params as parsed from `path`.
   */
  query: Record<string, string | number | boolean>;

  /**
   * Metadata registered to this route.
   */
  meta: T;
};

export enum FragTypes {
  Literal = 1,
  Param = 2,
  Wildcard = 3,
  NumericParam = 4,
}

export type RouteFragment = {
  name: string;
  type: FragTypes;
  value: string | number | null;
};

export type Route<T> = {
  pattern: string;
  fragments: RouteFragment[];
  meta: T;
};

export type RouteMatchOptions<T> = {
  willMatch?: (route: Route<T>) => boolean;
};

export class Router<T = any> {
  #routes: Route<T>[] = [];

  /**
   * Adds a new route that can be matched against when calling `match`.
   *
   * @param path - The path pattern to match. Supports named fragments and wildcards like `/path/{name}/*`.
   * @param meta - Any data you'd like to attach to this route.
   */
  addRoute(pattern: string, meta: T) {
    const fragments = this.#intoFragments(pattern);
    this.#routes.push({ pattern, meta, fragments });
    this.#sortRoutes();

    return this;
  }

  /**
   * Returns the nearest match, or undefined if the path matches no route.
   *
   * @param url - Path to match against routes.
   * @param options - Options to customize how matching operates.
   */
  match(
    url: string,
    options: RouteMatchOptions<T> = {}
  ): RouteMatch<T> | undefined {
    const [path, query] = url.split("?");
    const parts = this.#splitPath(path);

    routes: for (const route of this.#routes) {
      const { fragments } = route;
      const hasWildcard =
        fragments[fragments.length - 1]?.type === FragTypes.Wildcard;

      if (!hasWildcard && fragments.length !== parts.length) {
        continue routes;
      }

      if (options.willMatch && !options.willMatch(route)) {
        continue routes;
      }

      const matched: RouteFragment[] = [];

      fragments: for (let i = 0; i < fragments.length; i++) {
        const part = parts[i];
        const frag = fragments[i];

        if (part == null && frag.type !== FragTypes.Wildcard) {
          continue routes;
        }

        switch (frag.type) {
          case FragTypes.Literal:
            if (frag.name.toLowerCase() === part.toLowerCase()) {
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
          case FragTypes.NumericParam:
            if (!isNaN(Number(part))) {
              matched.push({ ...frag, value: Number(part) });
              break;
            } else {
              continue routes;
            }
          default:
            throw new Error(`Unknown fragment type: ${frag.type}`);
        }
      }

      const params = Object.create(null);

      for (const frag of matched) {
        if (frag.type === FragTypes.Param) {
          params[frag.name] = decodeURIComponent(frag.value as string);
        }

        if (frag.type === FragTypes.NumericParam) {
          params[frag.name] = frag.value as number;
        }

        if (frag.type === FragTypes.Wildcard) {
          params.wildcard = "/" + decodeURIComponent(frag.value as string);
        }
      }

      return {
        path: "/" + matched.map((f) => f.value).join("/"),
        pattern:
          "/" +
          fragments
            .map((f) => {
              if (f.type === FragTypes.Param) {
                return `{${f.name}}`;
              }

              if (f.type === FragTypes.NumericParam) {
                return `{#${f.name}}`;
              }

              return f.name;
            })
            .join("/"),
        params,
        query: this.#parseQueryParams(query),
        meta: route.meta,
      };
    }
  }

  /**
   * Sort routes descending by specificity. Guarantees that the most specific route matches first
   * no matter the order in which they were added.
   *
   * Routes without named params and routes with more fragments are weighted more heavily.
   */
  #sortRoutes() {
    const withoutParams = [];
    const withNumericParams = [];
    const withParams = [];
    const wildcard = [];

    for (const route of this.#routes) {
      const { fragments } = route;

      if (fragments.some((f) => f.type === FragTypes.Wildcard)) {
        wildcard.push(route);
      } else if (fragments.some((f) => f.type === FragTypes.NumericParam)) {
        withNumericParams.push(route);
      } else if (fragments.some((f) => f.type === FragTypes.Param)) {
        withParams.push(route);
      } else {
        withoutParams.push(route);
      }
    }

    const bySizeDesc = (a: Route<T>, b: Route<T>) => {
      if (a.fragments.length > b.fragments.length) {
        return -1;
      } else {
        return 1;
      }
    };

    withoutParams.sort(bySizeDesc);
    withNumericParams.sort(bySizeDesc);
    withParams.sort(bySizeDesc);
    wildcard.sort(bySizeDesc);

    this.#routes = [
      ...withoutParams,
      ...withNumericParams,
      ...withParams,
      ...wildcard,
    ];
  }

  /**
   * Separates a URL path into multiple fragments.
   *
   * @param path - A path string (e.g. `"/api/users/5"`)
   * @returns an array of fragments (e.g. `["api", "users", "5"]`)
   */
  #splitPath(path: string): string[] {
    return path
      .split("/")
      .map((f) => f.trim())
      .filter((f) => f !== "");
  }

  /**
   * Converts a route pattern into a set of matchable fragments.
   *
   * @param route - A route string (e.g. "/api/users/{id}")
   */
  #intoFragments(pattern: string): RouteFragment[] {
    const parts = this.#splitPath(pattern);
    const fragments = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part === "*") {
        if (i !== parts.length - 1) {
          throw new Error(
            `Wildcard must be at the end of a pattern. Received: ${pattern}`
          );
        }
        fragments.push({
          type: FragTypes.Wildcard,
          name: "*",
          value: null,
        });
      } else if (part.at(0) === "{" && part.at(-1) === "}") {
        fragments.push({
          type: part[1] === "#" ? FragTypes.NumericParam : FragTypes.Param,
          name: part[1] === "#" ? part.slice(2, -1) : part.slice(1, -1),
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

    return fragments;
  }

  #parseQueryParams(query: string): Record<string, string | number | boolean> {
    if (!query) return {};

    const entries = query
      .split("&")
      .filter((x) => x.trim() !== "")
      .map((entry) => {
        const [key, value] = entry.split("=").map((x) => x.trim());

        if (value.toLowerCase() === "true") {
          return [key, true] as const;
        }

        if (value.toLowerCase() === "false") {
          return [key, false] as const;
        }

        // Return value as a number if it parses as one.
        if (!isNaN(Number(value))) {
          return [key, Number(value)] as const;
        }

        return [key, value] as const;
      });

    return Object.fromEntries(entries);
  }
}
