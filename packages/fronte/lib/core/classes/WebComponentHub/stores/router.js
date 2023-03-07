import { Type, Router } from "@frameworke/bedrocke";
import { createBrowserHistory } from "history";
import queryString from "query-string";

import { Store } from "../../Store.js";
import { State } from "../../State.js";

export class RouterStore extends Store {
  setup(ctx) {
    const history = createBrowserHistory();
    let cancel;

    const $$path = new State("");
    const $$route = new State("");
    const $$params = new State({});
    const $$query = new State({});

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

    ctx.onConnect(() => {
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

    ctx.onDisconnect(() => {
      cancel();
    });

    function navigate(...args) {
      let path = "";
      let options = {};

      if (Type.isObject(args[args.length - 1])) {
        options = args.pop();
      }

      path = Router.resolvePath(history.location.pathname, Router.joinPath(...args));

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
