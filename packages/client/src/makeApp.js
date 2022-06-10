import { createHashHistory, createBrowserHistory } from "history";
import { makeDebug } from "./makeDebug.js";
import { makeService } from "./makeService.js";
import { isFunction, isString, isService } from "./helpers/typeChecking.js";

import HTTPService from "./services/@http.js";
import PageService from "./services/@page.js";
import RouterService from "./services/@router.js";

export function makeApp(options = {}) {
  const debug = makeDebug(options.debug);
  const appDebug = debug.makeChannel("woof:app");

  const routes = [];
  const services = {};

  let servicesCreated = false;
  let beforeConnect = async () => true;
  let afterConnect = async () => true;

  let history;
  let root;

  if (options.history) {
    history = options.history;
  } else if (options.hash) {
    history = createHashHistory();
  } else {
    history = createBrowserHistory();
  }

  /**
   * Recursively parses nested routes into an object structure suitable for the @router service.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
   */
  function parseRoute(path, component, defineRoutes) {
    if (!isFunction(component)) {
      throw new TypeError(`Route needs a path and a component function. Got: ${path} and ${component}`);
    }

    const parsed = {
      path,
      component,
    };

    if (defineRoutes != null) {
      const routes = [];

      const helpers = {
        route(path, component, defineRoutes) {
          routes.push(parseRoute(path, component, defineRoutes));
        },
        redirect(from, to) {
          routes.push({
            path: from,
            redirect: to,
          });
        },
      };

      defineRoutes.call(helpers, helpers);

      parsed.routes = routes;
    }

    return parsed;
  }

  ////
  // Public
  ////

  const methods = {
    /**
     * Adds a route to the list for matching when the URL changes.
     *
     * @param path - Path to match before calling handlers.
     * @param component - Component to display when route matches.
     * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
     */
    route(path, component, defineRoutes = null) {
      routes.push(parseRoute(path, component, defineRoutes));

      return methods;
    },

    /**
     * Adds a route that redirects to another path.
     *
     * @param path - Path to match.
     * @param to - New location for redirect.
     */
    redirect(path, to) {
      if (isString(to)) {
        routes.push({
          path: path,
          redirect: to,
        });
      } else {
        throw new TypeError(`Expected a path. Got: ${to}`);
      }

      return methods;
    },

    /**
     * Registers a service on the app. Services can be referenced in
     * Services and Components using `self.getService(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - A service to create and register under the name.
     * @param options - Object to be passed to service.created() function when called.
     */
    service(name, service, options) {
      if (isFunction(service) && !isService(service)) {
        service = makeService(service);
      }

      if (!isService(service)) {
        throw new TypeError(`Expected a service. Got: ${service}`);
      }

      if (!services[name]) {
        services[name] = {
          template: service,
          instance: null,
          options,
        };
      }

      // Merge with existing fields if overwriting.
      services[name].template = service;

      if (options !== undefined) {
        services[name].options = options;
      }

      return methods;
    },

    /**
     * Takes a function that configures the app before it is connected.
     * This function is called after services have been created, before the first route match.
     *
     * If the function returns a Promise, the app will not be connected until the Promise resolves.
     */
    beforeConnect(fn) {
      beforeConnect = async () => fn({ getService, debug: appDebug });

      return methods;
    },

    /**
     * Takes a function that configures the app after it is connected.
     * This function is called after the first route match.
     */
    afterConnect(fn) {
      afterConnect = async () => fn({ getService, debug: appDebug });

      return methods;
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

      if (element instanceof Node == false) {
        throw new TypeError(`Expected a DOM node. Got: ${element}`);
      }

      root = element;

      // Create registered services.
      for (const name in services) {
        const service = services[name];
        const debugChannel = debug.makeChannel(`service:${name}`);

        // First bits of app code are run; service functions called.
        service.instance = service.template({
          getService,
          debugChannel,
          options: service.options,
        });
      }

      // Unlock getService now that all services have been created.
      servicesCreated = true;

      // beforeConnect is the first opportunity to access other services.
      // This is also a good place to configure things before app-level `setup` runs.
      for (const name in services) {
        services[name].instance.beforeConnect();
      }

      return beforeConnect().then(async () => {
        // Send connected signal to all services.
        for (const name in services) {
          services[name].instance.afterConnect();
        }

        return afterConnect();
      });
    },
  };

  ////
  // Private
  ////

  /**
   * Returns the named service or throws an error if it isn't registered.
   * Every component and service in the app gets services through this function.
   *
   * @example getService("@page").$title.set("New Page Title")
   *
   * @param name - Name of a service. Built-in services start with `@`.
   */
  function getService(name) {
    if (!servicesCreated) {
      // This should only be reachable (by app code) in the body of a service function.
      throw new Error(
        `Service was requested before it was created. Services can only access other services in lifecycle hooks and exported functions. Got: ${name}`
      );
    }

    if (services[name]) {
      return services[name].instance.exports;
    }

    throw new Error(`Service is not registered in this app. Got: ${name}`);
  }

  ////
  // Built-in services
  ////

  methods.service("@debug", () => debug);
  methods.service("@router", RouterService, {
    getRoot() {
      return root;
    },
    history,
    routes,
  });
  methods.service("@page", PageService);
  methods.service("@http", HTTPService);

  return methods;
}
