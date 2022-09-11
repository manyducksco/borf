import { isFunction, isObject, isString, isTemplate } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { initGlobal } from "./helpers/initGlobal.js";
import { makeDebug } from "./helpers/makeDebug.js";

import { http } from "./globals/http.js";
import { page } from "./globals/page.js";
import { router } from "./globals/router.js";

export function makeApp(options = {}) {
  const globals = {
    router, // Access to matched route and query params.
    page, // Access to document settings like title and favicon.
    http, // HTTP client with middleware support.
  };

  const appContext = {
    globals: {},
    options,
    routes: [],
    debug: makeDebug(options.debug),
    rootElement: null,
  };

  let layerId = 0;

  let onBeforeConnect = async () => true;
  let onAfterConnect = async () => true;

  /**
   * Parses routes into a flat data structure appropriate for handling by the router service.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  function prepareRoutes(path, component, defineRoutes = null, layers = []) {
    if (isTemplate(component)) {
      const c = component;
      component = () => c;
    }

    if (!isFunction(component)) {
      throw new TypeError(`Route needs a path and a component function. Got: ${path} and ${component}`);
    }

    const routes = [];

    // Parse nested routes if they exist.
    if (defineRoutes != null) {
      const parts = splitRoute(path);
      const layer = { id: layerId++, component };

      // Remove trailing wildcard for joining with nested routes.
      if (parts[parts.length - 1] === "*") {
        parts.pop();
      }

      const helpers = {
        /**
         * Registers a new nested route with a path relative to the current route.
         */
        route: (path, component, defineRoutes) => {
          const fullPath = joinPath(...parts, path);

          routes.push(...prepareRoutes(fullPath, component, defineRoutes, [...layers, layer]));
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

      defineRoutes.call(helpers);
    } else {
      routes.push({
        path,
        fragments: parseRoute(path).fragments,
        layers: [...layers, { id: layerId++, component }],
      });
    }

    return routes;
  }

  /// /
  // Public
  /// /

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
     * @param component - Component to display when route matches.
     * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
     */
    route(path, component, defineRoutes = null) {
      appContext.routes.push(...prepareRoutes(path, component, defineRoutes));

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
     * This function is called after services have been created, before the first route match.
     *
     * If the function returns a Promise, the app will not be connected until the Promise resolves.
     */
    beforeConnect(fn) {
      onBeforeConnect = async () => {
        const ctx = {
          /**
           * Returns the global registered under `name` or throws an error if it isn't registered.
           */
          global(name) {
            if (!isString(name)) {
              throw new TypeError("Expected a string.");
            }

            if (appContext.globals[name]) {
              return appContext.globals[name].exports;
            }

            throw new Error(`Global '${name}' is not registered on this app.`);
          },

          debug: appContext.debug.makeChannel("woof:app:beforeConnect"),
        };

        return fn.call(ctx);
      };

      return this;
    },

    /**
     * Takes a function that configures the app after it is connected.
     * This function is called after the first route match.
     */
    afterConnect(fn) {
      onAfterConnect = async () => {
        const ctx = {
          /**
           * Returns the global registered under `name` or throws an error if it isn't registered.
           */
          global(name) {
            if (!isString(name)) {
              throw new TypeError("Expected a string.");
            }

            if (appContext.globals[name]) {
              return appContext.globals[name].exports;
            }

            throw new Error(`Global '${name}' is not registered on this app.`);
          },

          debug: appContext.debug.makeChannel("woof:app:afterConnect"),
        };

        return fn.call(ctx);
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

      if (element instanceof Node === false) {
        throw new TypeError(`Expected a DOM node. Got: ${element}`);
      }

      appContext.rootElement = element;

      // Set up crashing getters to handle services being accessed by other services.
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

        const global = initGlobal(fn, { appContext, name });

        if (!isObject(global.exports)) {
          throw new TypeError(`Global function for '${name}' did not return an object.`);
        }

        // Add to appContext.services
        Object.defineProperty(appContext.globals, name, {
          value: global,
          writable: false,
          enumerable: true,
          configurable: false,
        });
      }

      // beforeConnect is the first opportunity to configure globals before anything else happens.
      for (const global of Object.values(appContext.globals)) {
        global.beforeConnect();
      }

      return onBeforeConnect().then(async () => {
        // Send connected signal to all globals.
        for (const global of Object.values(appContext.globals)) {
          global.afterConnect();
        }

        return onAfterConnect();
      });
    },
  };
}
