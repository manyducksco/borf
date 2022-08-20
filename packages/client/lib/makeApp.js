import { isFunction, isObject, isService, isString, isTemplate } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { omit } from "./helpers/omit.js";

import HTTPService from "./services/http.js";
import PageService from "./services/page.js";
import RouterService from "./services/router.js";

import { makeService } from "./makeService.js";
import { makeDebug } from "./makeDebug.js";

export function makeApp(options = {}) {
  const services = {
    router: RouterService, // Access to matched route and query params.
    page: PageService, // Access to document settings like title and favicon.
    http: HTTPService, // HTTP client with middleware support.
  };

  Object.assign(services, options.services);

  const appContext = {
    services: {},
    options: omit(["services"], options),
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

    // if (isFunction(component)) {
    //   component = new Component(component);
    // }

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
            fragments: fragments,
          });
        },
      };

      defineRoutes.call(helpers, helpers);
    } else {
      routes.push({
        path,
        fragments: parseRoute(path).fragments,
        layers: [...layers, { id: layerId++, component }],
      });
    }

    return routes;
  }

  ////
  // Public
  ////

  return {
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
          path: path,
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
          services: appContext.services,
          debug: appContext.debug.makeChannel("woof:app:beforeConnect"),
        };

        return fn.call(ctx, ctx);
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
          services: appContext.services,
          debug: appContext.debug.makeChannel("woof:app:afterConnect"),
        };

        return fn.call(ctx, ctx);
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
      for (const name in services) {
        Object.defineProperty(appContext.services, name, {
          get() {
            throw new Error(
              `Service '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other services that access it.`
            );
          },
          configurable: true,
        });
      }

      for (const name in services) {
        let service = services[name];

        // Wrap a plain object in a function that returns it.
        if (isObject(service) && !isService(service)) {
          service = () => service;
        }

        // Wrap a function in a Service instance.
        if (isFunction(service)) {
          service = makeService(service);
        }

        // Expect the result to be a Service instance.
        if (!isService(service)) {
          throw new Error(
            `Service '${name}' must be an object, function that returns an object, or an instance of Service. Got ${typeof services[
              name
            ]}`
          );
        }

        // Store this service which is guaranteed to be a Service back in the app's _services store.
        services[name] = service;

        // Initialize the service to get its exports.
        const exports = service.init({ appContext, name });

        // Add to appContext.services
        Object.defineProperty(appContext.services, name, {
          value: exports,
          writable: false,
          enumerable: true,
          configurable: false,
        });
      }

      // beforeConnect is the first opportunity to configure services before anything else happens.
      for (const service of Object.values(services)) {
        service.beforeConnect();
      }

      return onBeforeConnect().then(async () => {
        // Send connected signal to all services.
        for (const service of Object.values(services)) {
          service.afterConnect();
        }

        return onAfterConnect();
      });
    },
  };
}
