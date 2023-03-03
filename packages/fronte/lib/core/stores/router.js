import queryString from "query-string";
import { createHashHistory, createBrowserHistory } from "history";
import { Store } from "../classes/Store.js";
import { State } from "../classes/State.js";
import { isObject, isFunction, isString } from "../helpers/typeChecking.js";
import { joinPath } from "../helpers/joinPath.js";
import { resolvePath } from "../helpers/resolvePath.js";
import { catchLinks } from "../helpers/catchLinks.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";

export class RouterStore extends Store {
  static inputs = {
    routes: {
      type: "array",
      about: "Routes to load for matching.",
    },
    options: {
      type: "object",
      about: "Router options passed through the 'router' field in the app config.",
    },
  };

  setup(ctx) {
    const appContext = ctx[APP_CONTEXT];
    const elementContext = ctx[ELEMENT_CONTEXT];

    const { routes, options } = ctx.inputs.get();

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
      if (route.meta.redirect) {
        const match = appContext.router.match(route.meta.redirect, {
          willMatch(r) {
            return r !== route;
          },
        });

        if (!match) {
          throw new Error(`Found a redirect to an undefined URL. From '${route.pattern}' to '${route.meta.redirect}'`);
        }
      }
    }

    const $$route = new State("");
    const $$path = new State("");
    const $$params = new State({});
    const $$query = new State({});

    // Track and skip updating the URL when the change came from URL navigation
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
      if (appContext.redirectPath) {
        history.replace({ pathname: appContext.redirectPath });
        appContext.redirectPath = null;
      }

      history.listen(onRouteChange);
      onRouteChange(history);

      catchLinks(appContext.rootElement, (anchor) => {
        let href = anchor.getAttribute("href");

        if (!/^https?:\/\/|^\//.test(href)) {
          href = joinPath(history.location.pathname, href);
        }

        history.push(href);

        ctx.log(`Intercepted link to '${href}'`);
      });
    });

    let activeLayers = [];
    let lastQuery;

    /**
     * Run when the location changes. Diffs and mounts new routes and updates
     * the $path, $route, $params and $query states accordingly.
     */
    async function onRouteChange({ location }) {
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

      // Skip remaining logic for apps with a top level view and no routes.
      if (routes.length === 0) {
        $$route.set(null);
        $$path.set(location.pathname);
        $$params.set({
          wildcard: location.pathname,
        });
        return;
      }

      const matched = appContext.router.match(location.pathname);

      // const matched = matchRoute(routes, location.pathname);

      if (matched) {
        if (matched.meta.redirect != null) {
          let path = matched.meta.redirect;

          for (const key in matched.params) {
            path = path.replace(":" + key, matched.params[key]);
          }

          history.replace(path);
        } else {
          $$path.set(matched.path);
          $$params.set(matched.params);

          if (matched.pattern !== $$route.get()) {
            $$route.set(matched.pattern);

            const { layers } = matched.meta;

            // Diff and update route layers.
            for (let i = 0; i < layers.length; i++) {
              const matchedLayer = layers[i];
              const activeLayer = activeLayers[i];

              if (activeLayer?.id !== matchedLayer.id) {
                activeLayers = activeLayers.slice(0, i);

                const parentLayer = activeLayers[activeLayers.length - 1];

                const mount = (view) => {
                  requestAnimationFrame(() => {
                    if (activeLayer && activeLayer.view.isConnected) {
                      // Disconnect first mismatched active and remove remaining layers.
                      activeLayer.view.disconnect();
                    }

                    if (parentLayer) {
                      parentLayer.view.setChildren(view);
                    } else {
                      appContext.rootView.setChildren(view);
                    }
                  });
                };

                let redirected = false;
                let preloadResult = {};

                if (matchedLayer.preload) {
                  preloadResult = await preloadRoute(matchedLayer.preload, {
                    appContext,
                    elementContext,
                    channelName: `preload:${matchedLayer.path}`,
                  });

                  if (preloadResult.redirectPath) {
                    // Redirect to other path.
                    redirected = true;
                    navigate(preloadResult.redirectPath, { replace: true });
                  }
                }

                if (!redirected) {
                  const view = matchedLayer.view.init({
                    appContext,
                    elementContext,
                    attributes: preloadResult.attributes || {},
                  });

                  mount(view);

                  // Push and connect new active layer.
                  activeLayers.push({ id: matchedLayer.id, view });
                }
              }
            }
          }
        }
      } else {
        ctx.warn('No route was matched. Consider adding a wildcard ("*") route or redirect to catch this.');
      }
    }

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
      $route: $$route.readable(),
      $path: $$path.readable(),
      $params: $$params.readable(),
      $$query,

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
      navigate,
    };
  }
}

/**
 * Prepare data before a route is mounted using a preload function.
 *
 * The preload function can return an object that will be passed to the mounted view as attributes.
 *
 * @param preload - Function that defines preload loading for a route.
 * @param mount - Function that takes a component instance and connects it to the DOM.
 */
export async function preloadRoute(preload, { appContext, channelName }) {
  return new Promise((resolve) => {
    const channel = appContext.debugHub.channel(channelName);
    let resolved = false;

    const ctx = {
      ...channel,

      global: (name) => {
        if (!isString(name)) {
          throw new TypeError("Expected a string.");
        }

        if (appContext.globals[name]) {
          return appContext.globals[name].exports;
        }

        throw new Error(`Global '${name}' is not registered on this app.`);
      },

      /**
       * Redirect to another route instead of loading this one.
       * @param {string} to - Redirect path (e.g. `/login`)
       */
      redirect(to) {
        if (!resolved) {
          resolve({
            redirectPath: to,
          });
          resolved = true;
        }
      },
    };

    const result = preload(ctx);

    if (!isFunction(result.then)) {
      throw new TypeError(`Preload function must return a Promise.`);
    }

    result.then((attributes) => {
      if (attributes && !isObject(attributes)) {
        throw new TypeError(`Preload function must return an attributes object or null/undefined. Got: ${attributes}`);
      }

      if (!resolved) {
        resolve({ attributes });
        resolved = true;
      }
    });
  });
}
