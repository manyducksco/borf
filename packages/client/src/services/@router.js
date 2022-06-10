import { makeState } from "@woofjs/state";
import { makeService } from "../makeService.js";
import { isObject } from "../helpers/typeChecking.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { joinPath } from "../helpers/joinPath.js";
import { makeRouter } from "@woofjs/router";

/**
 * Top level navigation service.
 */
export default makeService(({ options, debug, afterConnect, watchState }) => {
  debug.name = "woof:@router";

  const { history, routes } = options;

  const router = makeRouter();

  for (const route of routes) {
    debug.log(route);
  }

  const $route = makeState();
  const $path = makeState();
  const $params = makeState({});

  // Magic state that syncs with with the browser's query params
  const $query = makeState({});

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  function onHistoryChange(h) {
    debug.log(h);
  }

  afterConnect(() => {
    history.listen(onHistoryChange);
  });

  // Update $query when URL changes
  watchState($route, (current) => {
    isRouteChange = true;
    $query.set(current.query);
  });

  // Update URL when $query changes
  watchState($query, (current) => {
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
    $path,
    $params,
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
     * @example
     * navigate("/users", 215, { replace: true }); // replace current history entry with `/users/215`
     *
     * @param args - One or more path segments optionally followed by an options object.
     */
    navigate(...args) {
      let path = "";
      let options = {};

      if (isObject(args[args.length - 1])) {
        options = args.pop();
      }

      path = joinPath(...args);
      path = resolvePath(history.location.pathname, path);

      if (options.replace) {
        history.replace(path);
      } else {
        history.push(path);
      }
    },
  };
});
