import { Type, Router } from "@borf/bedrock";
import { createBrowserHistory } from "history";
import queryString, { type ParsedQuery } from "query-string";

import { Store } from "../../Store.js";
import { Writable } from "../../Writable.js";

interface NavigateOptions {
  /**
   * Replace the current item in the history stack instead of adding a new one.
   * The back button will send the user to the page they visited before this.
   */
  replace?: boolean;
}

export const RouterStore = Store.define({
  label: "router",
  setup: (ctx) => {
    const history = createBrowserHistory();
    let cancel: () => void;

    const $$pattern = new Writable<string | null>(null);
    const $$path = new Writable("");
    const $$params = new Writable({});
    const $$query = new Writable<ParsedQuery<string | number | boolean>>({});

    let lastQuery: string;
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
        params.set(key, String(current[key]));
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
          $$query.value = queryString.parse(location.search, {
            parseBooleans: true,
            parseNumbers: true,
          });
        }

        $$pattern.value = "";
        $$path.value = location.pathname;
        $$params.value = {
          wildcard: location.pathname,
        };
      });
    });

    ctx.onDisconnect(() => {
      cancel();
    });

    function navigate(path: Stringable, options?: NavigateOptions): void;
    function navigate(fragments: Stringable[], options?: NavigateOptions): void;

    function navigate(path: Stringable | Stringable[], options: NavigateOptions = {}) {
      let joined: string;

      if (Array.isArray(path)) {
        joined = Router.joinPath(path);
      } else {
        joined = path.toString();
      }

      joined = Router.resolvePath(history.location.pathname, joined);

      if (options.replace) {
        history.replace(joined);
      } else {
        history.push(joined);
      }
    }

    return {
      $path: $$path.toReadable(),
      $pattern: $$pattern.toReadable(),
      $params: $$params.toReadable(),
      $$query: $$query,

      back(steps = 1) {
        history.go(-steps);
      },

      forward(steps = 1) {
        history.go(steps);
      },

      navigate,
    };
  },
});
