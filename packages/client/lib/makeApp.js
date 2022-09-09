import { isFunction, isObject, isString, isTemplate } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { initService } from "./helpers/initService.js";

import { HTTPService } from "./services/http.js";
import { PageService } from "./services/page.js";
import { RouterService } from "./services/router.js";

import { makeDebug } from "./makeDebug.js";

export function makeApp(options = {}) {
  const services = {
    router: RouterService, // Access to matched route and query params.
    page: PageService, // Access to document settings like title and favicon.
    http: HTTPService, // HTTP client with middleware support.
  };

  const appContext = {
    services: {},
    options: options,
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
            fragments: fragments,
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

  ////
  // Public
  ////

  return {
    /**
     * Registers a new service accessible by services and components in this app.
     *
     * @param name - Name of the service.
     * @param service - The service function.
     */
    service(name, service) {
      services[name] = service;

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
          /**
           * Returns the service registered under `name` or throws an error if it isn't registered.
           */
          service(name) {
            if (!isString(name)) {
              throw new TypeError(`Expected a service name or array of service names.`);
            }

            if (appContext.services[name]) {
              return appContext.services[name];
            }

            throw new Error(`Service '${name}' is not registered on this app.`);
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
           * Returns the service registered under `name` or throws an error if it isn't registered.
           */
          service(name) {
            if (!isString(name)) {
              throw new TypeError(`Expected a service name or array of service names.`);
            }

            if (appContext.services[name]) {
              return appContext.services[name];
            }

            throw new Error(`Service '${name}' is not registered on this app.`);
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

        if (!isFunction(service)) {
          throw new Error(`Service '${name}' must be a function that returns an object. Got ${typeof services[name]}`);
        }

        services[name] = initService(service, { appContext, name });

        if (!isObject(services[name].exports)) {
          throw new TypeError(`Service function for '${name}' did not return an object.`);
        }

        // Add to appContext.services
        Object.defineProperty(appContext.services, name, {
          value: services[name].exports,
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
