import { createBrowserHistory } from "history";
import queryString from "query-string";

import { Store } from "../../core/classes/Store.js";
import { makeState } from "../../core/makeState.js";
import { isObject } from "../../core/helpers/typeChecking.js";
import { resolvePath } from "../../core/helpers/resolvePath.js";
import { joinPath } from "../../core/helpers/joinPath.js";

export class RouterStore extends Store {
  setup(ctx) {
    const history = createBrowserHistory();
    let cancel;

    const $$path = makeState("");
    const $$route = makeState("");
    const $$params = makeState({});
    const $$query = makeState({});

    let lastQuery;
    let isRouteChange = false;

    // Update URL when query changes
    ctx.observe($$query, (current) => {
      // No-op if this is triggered by a route change.
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

    ctx.beforeConnect(() => {
      cancel = history.listen(({ location }) => {
        // Update query params if they've changed.
        if (location.search !== lastQuery) {
          lastQuery = location.search;

          isRouteChange = true;
          $$query.set(
            queryString.parse(location.search, {
              parseBooleans: true,
              parseNumbers: true,
            })
          );
        }

        $$route.set(null);
        $$path.set(location.pathname);
        $$params.set({
          wildcard: location.pathname,
        });
      });
    });

    ctx.beforeDisconnect(() => {
      cancel();
    });

    function navigate(...args) {
      let path = "";
      let options = {};

      if (isObject(args[args.length - 1])) {
        options = args.pop();
      }

      path = resolvePath(history.location.pathname, joinPath(...args));

      if (options.replace) {
        history.replace(path);
      } else {
        history.push(path);
      }
    }

    return {
      $path: $$path.readable(),
      $route: $$route.readable(),
      $params: $$params.readable(),
      $$query: $$query,

      back(steps = 1) {
        history.go(-steps);
      },

      forward(steps = 1) {
        history.go(steps);
      },

      navigate,
    };
  }
}
