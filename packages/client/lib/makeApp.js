import { isBlueprint, isFunction, isObject, isString } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { makeDebug } from "./helpers/makeDebug.js";

import dialog from "./global/built-ins/dialog.js";
import http from "./global/built-ins/http.js";
import page from "./global/built-ins/page.js";
import router from "./global/built-ins/router.js";

import { initGlobal } from "./global/helpers/initGlobal.js";

const builtInGlobals = [dialog, router, page, http];

/**
 * Creates a woof application.
 */
export function makeApp(options = {}) {
  const globals = {
    "@dialog": dialog,
    "@router": router,
    "@page": page,
    "@http": http,
  };

  const appContext = {
    options,
    debug: makeDebug(options.debug ?? {}),
    globals: {},
    routes: [],
    rootElement: null,
    // $dialogs - added by dialog global
  };

  let layerId = 0;

  let onBeforeConnect = async () => true;
  let onAfterConnect = async () => true;

  /**
   * Parses routes into a flat data structure appropriate for handling by the router service.
   *
   * @param path - Path to match before calling handlers.
   * @param view - View to display when route matches.
   * @param defineRoutes - Function that defines routes to be displayed as children of `window`.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  function prepareRoutes(path, view, defineRoutes = null, layers = []) {
    let preload;
    let subroutes = defineRoutes;

    // Config object
    if (isObject(view) && typeof view.view === "function") {
      subroutes = view.subroutes;
      preload = view.preload;
      view = view.view;
    }

    if (isBlueprint(view)) {
      const c = view;
      view = () => c;
    }

    if (!isFunction(view)) {
      throw new TypeError(`Route needs a path and a view function. Got: ${path} and ${view}`);
    }

    const routes = [];
    const layer = { id: layerId++, view, preload };

    // Parse nested routes if they exist.
    if (subroutes != null) {
      const parts = splitRoute(path);

      // Remove trailing wildcard for joining with nested routes.
      if (parts[parts.length - 1] === "*") {
        parts.pop();
      }

      const helpers = {
        /**
         * Registers a new nested route with a path relative to the current route.
         */
        route: (path, view, defineRoutes) => {
          const fullPath = joinPath(...parts, path);

          routes.push(...prepareRoutes(fullPath, view, defineRoutes, [...layers, layer]));
        },
        /**
         * Registers a new nested redirect with a path relative to the current route.
         */
        redirect: (from, to) => {
          from = joinPath(...parts, from);
          to = resolvePath(joinPath(...parts), to);
          const { fragments } = parseRoute(from);

          if (!to.startsWith("/")) {
            to = "/" + to;
          }

          routes.push({
            path: from,
            redirect: to,
            fragments,
          });
        },
      };

      subroutes.call(helpers, helpers);
    } else {
      routes.push({
        path,
        fragments: parseRoute(path).fragments,
        layers: [...layers, layer],
      });
    }

    return routes;
  }

  ////
  // Public
  ////

  return {
    /**
     * Registers a new global accessible throughout the app.
     *
     * @param name - Name of the service.
     * @param fn - The global function.
     */
    global(name, fn) {
      globals[name] = fn;

      return this;
    },

    /**
     * Adds a route to the list for matching when the URL changes.
     *
     * @param path - Path to match before calling handlers.
     * @param view - View to display when route matches.
     * @param defineRoutes - Function that defines routes to be displayed as children of `window`.
     */
    route(path, view, defineRoutes = null) {
      appContext.routes.push(...prepareRoutes(path, view, defineRoutes));

      return this;
    },

    /**
     * Adds a route that redirects to another path.
     *
     * @param path - Path to match.
     * @param to - New location for redirect.
     */
    redirect(path, to) {
      if (isString(to)) {
        appContext.routes.push({
          path,
          redirect: to,
        });
      } else {
        throw new TypeError(`Expected a path. Got: ${to}`);
      }

      return this;
    },

    /**
     * Takes a function that configures the app before it is connected.
     * This function is called after globals have been created, before the first route match.
     *
     * If the function returns a Promise, the app will not be connected until the Promise resolves.
     */
    beforeConnect(fn) {
      onBeforeConnect = async () => {
        const channel = appContext.debug.makeChannel("woof:app:beforeConnect");

        const ctx = {
          ...channel,

          global(name) {
            if (!isString(name)) {
              throw new TypeError("Expected a string.");
            }

            if (appContext.globals[name]) {
              return appContext.globals[name].exports;
            }

            throw new Error(`Global '${name}' is not registered on this app.`);
          },
        };

        return fn(ctx);
      };

      return this;
    },

    /**
     * Takes a function that configures the app after it is connected.
     * This function is called after the first route match.
     */
    afterConnect(fn) {
      onAfterConnect = async () => {
        const channel = appContext.debug.makeChannel("woof:app:afterConnect");

        const ctx = {
          ...channel,

          global(name) {
            if (!isString(name)) {
              throw new TypeError("Expected a string.");
            }

            if (appContext.globals[name]) {
              return appContext.globals[name].exports;
            }

            throw new Error(`Global '${name}' is not registered on this app.`);
          },
        };

        return fn(ctx);
      };

      return this;
    },

    /**
     * Initializes the app and starts routing.
     *
     * @param element - Selector string or DOM node to attach to.
     */
    async connect(element) {
      if (isString(element)) {
        element = document.querySelector(element);
      }

      if (!(element instanceof Node)) {
        throw new TypeError(`Expected a DOM node. Got: ${element}`);
      }

      appContext.rootElement = element;

      // Set up crashing getters to handle globals being accessed by other globals.
      for (const name in globals) {
        Object.defineProperty(appContext.globals, name, {
          get() {
            throw new Error(
              `Global '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other globals that access it.`
            );
          },
          configurable: true,
        });
      }

      for (const name in globals) {
        const fn = globals[name];

        if (!isFunction(fn)) {
          throw new Error(`Service '${name}' must be a function that returns an object. Got ${typeof globals[name]}`);
        }

        let channelPrefix;
        if (builtInGlobals.includes(fn)) {
          channelPrefix = "woof:global";
        }

        const global = initGlobal(fn, { appContext, channelPrefix, name });

        if (!isObject(global.exports)) {
          throw new TypeError(`Global function for '${name}' did not return an object.`);
        }

        // Add to appContext.globals
        Object.defineProperty(appContext.globals, name, {
          value: global,
          writable: false,
          enumerable: true,
          configurable: false,
        });
      }

      // beforeConnect is the first opportunity to configure globals before anything else happens.
      for (const global of Object.values(appContext.globals)) {
        await global.beforeConnect();
      }

      return onBeforeConnect().then(async () => {
        // Send connected signal to all globals.
        for (const global of Object.values(appContext.globals)) {
          global.afterConnect();
        }

        connectDialogs(appContext);

        return onAfterConnect();
      });
    },
  };
}

/**
 * Creates a dialog outlet element that gets added to the DOM to contain dialogs
 * when there is at least one in the list.
 */
function connectDialogs(appContext) {
  const { rootElement, $dialogs } = appContext;
  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.top = "0";
  container.style.right = "0";
  container.style.bottom = "0";
  container.style.left = "0";
  container.style.zIndex = "99999";

  let activeDialogs = [];

  $dialogs.subscribe((dialogs) => {
    requestAnimationFrame(() => {
      let removed = [];
      let added = [];

      for (const dialog of activeDialogs) {
        if (!dialogs.includes(dialog)) {
          removed.push(dialog);
        }
      }

      for (const dialog of dialogs) {
        if (!activeDialogs.includes(dialog)) {
          added.push(dialog);
        }
      }

      for (const dialog of removed) {
        dialog.disconnect();
        activeDialogs.splice(activeDialogs.indexOf(dialog), 1);
      }

      for (const dialog of added) {
        dialog.connect(container);
        activeDialogs.push(dialog);
      }

      if (activeDialogs.length > 0) {
        if (!container.parentNode) {
          rootElement.appendChild(container);
        }
      } else {
        if (container.parentNode) {
          rootElement.removeChild(container);
        }
      }
    });
  });
}
