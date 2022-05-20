import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isString } from "../helpers/typeChecking.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { makeDolla } from "../makeDolla.js";

/**
 * Top level navigation service.
 */
export default makeService((self) => {
  self.debug.name = "woof:service:@router";

  const { history } = self.options;

  const $route = makeState({
    path: "",
    href: "",
    query: {},
    params: {},
    route: "",
    wildcard: null,
  });

  // Magic state that syncs with with the browser's query params
  const $query = makeState({});

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  // Update $query when URL changes
  self.watchState($route, (current) => {
    isRouteChange = true;
    $query.set(current.query);
  });

  // Update URL when $query changes
  self.watchState($query, (current) => {
    if (isRouteChange) {
      isRouteChange = false;
      return;
    }

    const params = new URLSearchParams();

    for (const key in current) {
      params.set(key, current[key]);
    }

    history.replace({
      pathname: history.location.pathname,
      search: "?" + params.toString(),
    });
  });

  return {
    $route,
    $query,

    back(steps = 1) {
      history.go(-steps);
    },

    forward(steps = 1) {
      history.go(steps);
    },

    /**
     * Navigates to another route.
     *
     * @param path - Path string
     * @param options - `replace: true` to replace state
     */
    go(path, options = {}) {
      if (isString(path)) {
        path = resolvePath(history.location.pathname, path);

        if (options.replace) {
          history.replace(path);
        } else {
          history.push(path);
        }
      } else {
        throw new TypeError(`Expected a string. Got: ${path}`);
      }
    },
  };
});
