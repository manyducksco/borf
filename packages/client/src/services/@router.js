import queryString from "query-string";
import { createHashHistory, createBrowserHistory } from "history";
import { makeState } from "@woofjs/state";
import { matchRoute, parseRoute } from "../helpers/routing.js";
import { isObject } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { catchLinks } from "../helpers/catchLinks.js";
import { initComponent } from "../helpers/initComponent.js";

import { Outlet } from "../components/Outlet.js";

/**
 * Top level navigation service.
 */
export default function RouterService(self) {
  self.debug.name = "woof:@router";

  const { options } = self;

  let history;

  if (options.history) {
    history = options.history;
  } else if (options.hash) {
    history = createHashHistory();
  } else {
    history = createBrowserHistory();
  }

  let routes = [];

  // Parse route paths into a matchable format.
  for (const route of options.routes) {
    routes.push({
      ...route,
      fragments: parseRoute(route.path).fragments,
    });
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

  let appOutlet;
  let activeLayers = [];
  let lastQuery;

  const $route = makeState(); // Route path with placeholder parameters
  const $path = makeState(); // Real path as it shows up in the URL bar
  const $params = makeState({}); // Matched values for named route params
  const $query = makeState({}); // Magic state that syncs with with the browser's query params

  // Track and skip updating the URL when the change came from URL navigation
  let isRouteChange = false;

  // Update URL when $query changes
  self.watchState(
    $query,
    (current) => {
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
    },
    { immediate: false }
  );

  self.afterConnect(() => {
    const root = options.getRoot();

    appOutlet = initComponent(self.getService("@app"), Outlet);
    appOutlet.connect(root);

    history.listen(onRouteChange);
    onRouteChange(history);

    catchLinks(root, (anchor) => {
      let href = anchor.getAttribute("href");

      if (!/^https?:\/\/|^\//.test(href)) {
        href = joinPath(history.location.pathname, href);
      }

      history.push(href);

      self.debug.log(`Intercepted link to '${href}'`);
    });
  });

  /**
   * Run when the location changes. Diffs and mounts new routes and updates
   * the $path, $route, $params and $query states accordingly.
   */
  async function onRouteChange({ location }) {
    const matched = matchRoute(routes, location.pathname);

    if (matched) {
      if (matched.data.redirect != null) {
        let path = matched.data.redirect;

        for (const key in matched.params) {
          path = path.replace(":" + key, matched.params[key]);
        }

        history.replace(path);
      } else {
        $path.set(matched.path);
        $params.set(matched.params);

        if (matched.route !== $route.get()) {
          $route.set(matched.route);

          const { layers } = matched.data;

          // Diff and update route layers.
          for (let i = 0; i < layers.length; i++) {
            const matchedLayer = layers[i];
            const activeLayer = activeLayers[i];

            if (activeLayer?.id !== matchedLayer.id) {
              if (activeLayer) {
                // Disconnect first mismatched active and remove remaining layers.
                activeLayer.component.disconnect();
              }

              activeLayers = activeLayers.slice(0, i);

              const app = self.getService("@app");
              const outlet = initComponent(app, Outlet);
              const component = initComponent(app, matchedLayer.component, null, [outlet]);

              const parentLayer = activeLayers[activeLayers.length - 1];

              const mount = (component) => {
                if (parentLayer) {
                  parentLayer.outlet.$attrs.set({
                    element: component,
                  });
                } else {
                  appOutlet.$attrs.set({
                    element: component,
                  });
                }
              };

              if (component.hasRoutePreload) {
                await component.routePreload(mount);
              }

              mount(component);

              // Push and connect new active layer.
              activeLayers.push({
                id: matchedLayer.id,
                component,
                outlet,
              });
            }
          }
        }
      }
    } else {
      self.debug.warn(`No route was matched. Consider adding a wildcard ("*") route or redirect to catch this.`);
    }

    // Update query params if they've changed.
    if (location.search !== lastQuery) {
      lastQuery = location.search;

      isRouteChange = true;
      $query.set(
        queryString.parse(location.search, {
          parseBooleans: true,
          parseNumbers: true,
        })
      );
    }
  }

  return {
    $route: $route.map(),
    $path: $path.map(),
    $params: $params.map(),
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

      path = resolvePath(history.location.pathname, joinPath(...args));

      if (options.replace) {
        history.replace(path);
      } else {
        history.push(path);
      }
    },
  };
}
