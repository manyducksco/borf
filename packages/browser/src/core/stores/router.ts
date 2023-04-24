import { createHashHistory, createBrowserHistory, type History, type Listener } from "history";
import { Router } from "@borf/bedrock";
import { Writable } from "../classes/Writable.js";
import { Markup } from "../classes/Markup_temp.js";
import { catchLinks } from "../helpers/catchLinks.js";
import { getAppContext, getElementContext, type ComponentCore, type ComponentControls } from "../component.js";

// ----- Types ----- //

export interface RouterOptions {
  /**
   * Use hash-based routing if true.
   */
  hash?: boolean;

  /**
   * A history object from the `history` package.
   *
   * @see https://www.npmjs.com/package/history
   */
  history?: History;
}

export interface RouteConfig {
  pattern: string;
  meta: {
    redirect?: string | ((ctx: RedirectContext) => void);
    pattern?: string;
    layers?: RouteLayer[];
  };
}

export interface RouteLayer {
  id: number;
  markup: Markup;
}

/**
 * Properties passed to a redirect function.
 */
export interface RedirectContext {
  /**
   * The path as it appears in the URL bar.
   */
  path: string;

  /**
   * The pattern that this path was matched with.
   */
  pattern: string;

  /**
   * Named route params parsed from `path`.
   */
  params: Record<string, string | number | undefined>;

  /**
   * Query params parsed from `path`.
   */
  query: Record<string, string | number | boolean | undefined>;
}

/**
 * An active route layer whose markup has been initialized into a view.
 */
interface ActiveLayer {
  id: number;
  view: ComponentControls;
}

interface ParsedParams {
  [key: string]: string | number | boolean | (string | number | boolean | null)[] | null;
}

interface ParsedQuery extends ParsedParams {}

interface NavigateOptions {
  /**
   * Replace the current item in the history stack instead of adding a new one.
   * The back button will send the user to the page they visited before this.
   */
  replace?: boolean;
}

/**
 * Inputs passed to the RouterStore when the app is connected.
 */
type RouterInputs = {
  /**
   * Router options passed through the 'router' field in the app config.
   */
  options: RouterOptions;

  /**
   * An instance of Router with the app's routes preloaded.
   */
  router: Router<RouteConfig["meta"]>;
};

// ----- Code ----- //

export function RouterStore(self: ComponentCore<RouterInputs>) {
  self.setName("borf:router");

  const appContext = getAppContext(self);
  const elementContext = getElementContext(self);

  const { options, router } = self.inputs.get();

  let history: History;

  if (options.history) {
    history = options.history;
  } else if (options.hash) {
    history = createHashHistory();
  } else {
    history = createBrowserHistory();
  }

  // Test redirects to make sure all possible redirect targets actually exist.
  // for (const route of routes) {
  //   if (route.meta.redirect) {
  //     const match = appContext.router.match(route.meta.redirect, {
  //       willMatch(r) {
  //         return r !== route;
  //       },
  //     });

  //     if (!match) {
  //       throw new Error(`Found a redirect to an undefined URL. From '${route.pattern}' to '${route.meta.redirect}'`);
  //     }
  //   }
  // }

  const $$pattern = new Writable<string | null>(null);
  const $$path = new Writable("");
  const $$params = new Writable<ParsedParams>({});
  const $$query = new Writable<ParsedQuery>({});

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  // Update URL when query changes
  self.observe($$query, (current) => {
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

  self.onConnected(() => {
    history.listen(onRouteChange);
    onRouteChange(history);

    catchLinks(appContext.rootElement!, (anchor) => {
      let href = anchor.getAttribute("href")!;

      if (!/^https?:\/\/|^\//.test(href)) {
        href = Router.joinPath([history.location.pathname, href]);
      }

      history.push(href);
    });
  });

  let activeLayers: ActiveLayer[] = [];
  let lastQuery: string;

  /**
   * Run when the location changes. Diffs and mounts new routes and updates
   * the $path, $route, $params and $query states accordingly.
   */
  const onRouteChange: Listener = async ({ location }) => {
    // Update query params if they've changed.
    if (location.search !== lastQuery) {
      lastQuery = location.search;

      isRouteChange = true;
      $$query.value = Router.parseQuery(location.search);
    }

    const matched = router.match(location.pathname);

    if (!matched) {
      $$pattern.value = null;
      $$path.value = location.pathname;
      $$params.value = {
        wildcard: location.pathname,
      };
      return;
    }

    self.debug.info(`matched route '${matched.pattern}'`);

    if (matched.meta.redirect != null) {
      if (typeof matched.meta.redirect === "string") {
        let path = matched.meta.redirect;

        for (const key in matched.params) {
          path = path.replace(":" + key, matched.params[key].toString());
        }

        // TODO: Update this code to work with new `{param}` style. Looks like it's still for `:params`

        self.debug.info(`redirecting to '${path}'`);
        history.replace(path);
      } else if (typeof matched.meta.redirect === "function") {
        // TODO: Implement redirect by function.
        throw new Error(`Redirect functions aren't implemented yet.`);
      } else {
        throw new TypeError(`Redirect must either be a path string or a function.`);
      }
    } else {
      $$path.value = matched.path;
      $$params.value = matched.params;

      if (matched.pattern !== $$pattern.value) {
        $$pattern.value = matched.pattern;

        const layers = matched.meta.layers!;

        // Diff and update route layers.
        for (let i = 0; i < layers.length; i++) {
          const matchedLayer = layers[i];
          const activeLayer = activeLayers[i];

          if (activeLayer?.id !== matchedLayer.id) {
            self.debug.info(`replacing layer@${i} (active: ${activeLayer?.id}, matched: ${matchedLayer.id})`);
            activeLayers = activeLayers.slice(0, i);

            const parentLayer = activeLayers[activeLayers.length - 1];
            const view = matchedLayer.markup.init({ appContext, elementContext }) as ComponentControls;

            requestAnimationFrame(() => {
              if (activeLayer && activeLayer.view.isConnected) {
                // Disconnect first mismatched active layer.
                activeLayer.view.disconnect();
              }

              const markup = new Markup(() => view);

              if (parentLayer) {
                parentLayer.view.$$children.set([markup]);
              } else {
                appContext.rootView!.$$children.set([markup]);
              }
            });

            // Push and connect new active layer.
            activeLayers.push({ id: matchedLayer.id, view });
          }
        }
      }
    }
  };

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
    /**
     * The currently matched route pattern, if any.
     */
    $pattern: $$pattern.toReadable(),

    /**
     * The current URL path.
     */
    $path: $$path.toReadable(),

    /**
     * The current named path params.
     */
    $params: $$params.toReadable(),

    /**
     * The current query params. Changes to this object will be reflected in the URL.
     */
    $$query,

    /**
     * Navigate backward. Pass a number of steps to hit the back button that many times.
     */
    back(steps = 1) {
      history.go(-steps);
    },

    /**
     * Navigate forward. Pass a number of steps to hit the forward button that many times.
     */
    forward(steps = 1) {
      history.go(steps);
    },

    /**
     * Navigates to another route.
     *
     * @example
     * navigate("/login"); // navigate to `/login`
     * navigate(["/users", 215], { replace: true }); // replace current history entry with `/users/215`
     *
     * @param args - One or more path segments optionally followed by an options object.
     */
    navigate,
  };
}
