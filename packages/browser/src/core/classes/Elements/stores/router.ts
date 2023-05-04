import { joinPath, parseQueryParams, resolvePath } from "@borf/bedrock";
import { createBrowserHistory } from "history";

import { Writable } from "../../Writable.js";
import { useConnected, useDisconnected, useName, useObserver } from "../../../hooks/index.js";

interface NavigateOptions {
  /**
   * Replace the current item in the history stack instead of adding a new one.
   * The back button will send the user to the page they visited before this.
   */
  replace?: boolean;
}

export function RouterStore(attrs: {}) {
  useName("borf:router");

  const history = createBrowserHistory();
  let cancel: () => void;

  const $$pattern = new Writable<string | null>(null);
  const $$path = new Writable("");
  const $$params = new Writable({});
  const $$query = new Writable<Record<string, string | number | boolean>>({});

  let lastQuery: string;
  let isRouteChange = false;

  // Update URL when query changes
  useObserver($$query, (current) => {
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

  useConnected(() => {
    cancel = history.listen(({ location }) => {
      // Update query params if they've changed.
      if (location.search !== lastQuery) {
        lastQuery = location.search;

        isRouteChange = true;
        $$query.value = parseQueryParams(location.search);
      }

      $$pattern.value = "";
      $$path.value = location.pathname;
      $$params.value = {
        wildcard: location.pathname,
      };
    });
  });

  useDisconnected(() => {
    cancel();
  });

  function navigate(path: Stringable, options?: NavigateOptions): void;
  function navigate(fragments: Stringable[], options?: NavigateOptions): void;

  function navigate(path: Stringable | Stringable[], options: NavigateOptions = {}) {
    let joined: string;

    if (Array.isArray(path)) {
      joined = joinPath(path);
    } else {
      joined = path.toString();
    }

    joined = resolvePath(history.location.pathname, joined);

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
}
