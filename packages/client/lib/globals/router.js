import queryString from "query-string";
import { createHashHistory, createBrowserHistory } from "history";

import { APP_CONTEXT } from "../keys.js";
import { matchRoute } from "../helpers/routing.js";
import { isObject } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { catchLinks } from "../helpers/catchLinks.js";
import { makeView } from "../makers/makeView.js";

import { Outlet } from "../views/Outlet.js";

/**
 * Top level navigation service.
 */
export default function router() {
  const appContext = this[APP_CONTEXT];
  const options = appContext.options.router || {};
  const routes = appContext.routes;

  let history;

  if (options.history) {
    history = options.history;
  } else if (options.hash) {
    history = createHashHistory();
  } else {
    history = createBrowserHistory();
  }

  // Test redirects to make sure all possible redirect targets actually exist.
  for (const route of routes) {
    if (route.redirect) {
      const match = matchRoute(
        routes.filter((r) => r !== route),
        route.redirect
      );

      if (!match) {
        throw new Error(`Found a redirect to an undefined URL. From '${route.path}' to '${route.redirect}'`);
      }
    }
  }

  this.defaultState = {
    route: "",
    path: "",
    params: {},
    query: {},
  };

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  // Update URL when query changes
  this.observe("query", (current) => {
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

  let appOutlet;
  let activeLayers = [];
  let lastQuery;

  this.afterConnect(() => {
    const root = appContext.rootElement;

    appOutlet = makeView(Outlet, { appContext });
    appOutlet.connect(root);

    history.listen(onRouteChange);
    onRouteChange(history);

    catchLinks(root, (anchor) => {
      let href = anchor.getAttribute("href");

      if (!/^https?:\/\/|^\//.test(href)) {
        href = joinPath(history.location.pathname, href);
      }

      history.push(href);

      this.log(`Intercepted link to '${href}'`);
    });
  });

  /**
   * Run when the location changes. Diffs and mounts new routes and updates
   * the $path, $route, $params and $query states accordingly.
   */
  const onRouteChange = async ({ location }) => {
    const matched = matchRoute(routes, location.pathname);

    if (matched) {
      if (matched.data.redirect != null) {
        let path = matched.data.redirect;

        for (const key in matched.params) {
          path = path.replace(":" + key, matched.params[key]);
        }

        history.replace(path);
      } else {
        this.set("path", matched.path);
        this.set("params", matched.params);

        if (matched.route !== this.get("route")) {
          this.set("route", matched.route);

          const { layers } = matched.data;

          // Diff and update route layers.
          for (let i = 0; i < layers.length; i++) {
            const matchedLayer = layers[i];
            const activeLayer = activeLayers[i];

            if (activeLayer?.id !== matchedLayer.id) {
              activeLayers = activeLayers.slice(0, i);

              this.log({ activeLayer, matchedLayer });

              const outlet = makeView(Outlet, { appContext });
              const view = makeView(matchedLayer.view, { children: [outlet], appContext });

              const parentLayer = activeLayers[activeLayers.length - 1];

              const mount = (view) => {
                requestAnimationFrame(() => {
                  if (activeLayer && activeLayer.view.isConnected) {
                    // Disconnect first mismatched active and remove remaining layers.
                    activeLayer.view.disconnect({ allowTransitionOut: true });
                  }

                  if (parentLayer) {
                    parentLayer.outlet.state.set("element", view);
                  } else {
                    appOutlet.state.set("element", view);
                  }
                });
              };

              if (view.hasRoutePreload) {
                await view.routePreload(mount);
              }

              mount(view);

              // Push and connect new active layer.
              activeLayers.push({
                id: matchedLayer.id,
                view,
                outlet,
              });
            }
          }
        }
      }
    } else {
      this.warn('No route was matched. Consider adding a wildcard ("*") route or redirect to catch this.');
    }

    // Update query params if they've changed.
    if (location.search !== lastQuery) {
      lastQuery = location.search;

      isRouteChange = true;
      this.set(
        "query",
        queryString.parse(location.search, {
          parseBooleans: true,
          parseNumbers: true,
        })
      );
    }
  };

  return {
    $route: this.readable("route"),
    $path: this.readable("path"),
    $params: this.readable("params"),
    $$query: this.writable("query"),

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

      path = resolvePath(history.location.pathname, joinPath(...args));

      if (options.replace) {
        history.replace(path);
      } else {
        history.push(path);
      }
    },
  };
}
