import { makeDebug } from "./makeDebug.js";
import { initService } from "./helpers/initService.js";
import { isFunction, isString, isTemplate } from "./helpers/typeChecking.js";
import { splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";

import HTTPService from "./services/http.js";
import PageService from "./services/page.js";
import RouterService from "./services/router.js";

import { Service } from "./Service.js";

export class App {
  _routes = [];
  _registeredServices = {};
  _appContext;

  _root;
  _layerId = 0;

  _onBeforeConnect = async () => true;
  _onAfterConnect = async () => true;

  constructor(options = {}) {
    this._appContext = {
      services: {},
      debug: makeDebug(options.debug),
    };

    ////
    // Built-in services
    ////

    // Access to matched route and query params.
    this.service("router", RouterService, {
      options: {
        ...(options.router || {}),
        appContext: this._appContext,
        routes: this._routes,
        getRoot: () => {
          return this._root;
        },
      },
    });

    // Access to document settings like title and favicon.
    this.service("page", PageService);

    // HTTP client with middleware support.
    this.service("http", HTTPService);
  }

  /**
   * Parses routes into a flat data structure appropriate for handling by the router service.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  _prepareRoutes(path, component, defineRoutes = null, layers = []) {
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
      const layer = { id: this._layerId++, component };

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

          routes.push(...this._prepareRoutes(fullPath, component, defineRoutes, [...layers, layer]));
        },
        /**
         * Registers a new nested redirect with a path relative to the current route.
         */
        redirect: (from, to) => {
          from = joinPath(...parts, from);
          to = resolvePath(joinPath(...parts), to);

          if (!to.startsWith("/")) {
            to = "/" + to;
          }

          routes.push({
            path: from,
            redirect: to,
          });
        },
      };

      defineRoutes.call(helpers, helpers);
    } else {
      routes.push({
        path,
        layers: [...layers, { id: this._layerId++, component }],
      });
    }

    return routes;
  }

  ////
  // Public
  ////

  /**
   * Adds a route to the list for matching when the URL changes.
   *
   * @param path - Path to match before calling handlers.
   * @param component - Component to display when route matches.
   * @param defineRoutes - Function that defines routes to be displayed as children of `component`.
   */
  route(path, component, defineRoutes = null) {
    this._routes.push(...this._prepareRoutes(path, component, defineRoutes));

    return this;
  }

  /**
   * Adds a route that redirects to another path.
   *
   * @param path - Path to match.
   * @param to - New location for redirect.
   */
  redirect(path, to) {
    if (isString(to)) {
      this._routes.push({
        path: path,
        redirect: to,
      });
    } else {
      throw new TypeError(`Expected a path. Got: ${to}`);
    }

    return this;
  }

  /**
   * Registers a service on the app. Services can be referenced in
   * Services and Components using `self.getService(name)`.
   *
   * @param name - Unique string to name this service.
   * @param service - A service to create and register under the name.
   * @param config - Configuration options for the service. Can contain an `options` object that is passed to the service.
   */
  service(name, service, config = {}) {
    if (service instanceof Service) {
      service = service.bootstrap;
    }

    if (!isFunction(service)) {
      throw new TypeError(`Expected a service function. Got: ${service} (${typeof service})`);
    }

    if (!this._registeredServices[name]) {
      this._registeredServices[name] = {
        fn: service,
        options: config.options || {},
        instance: null,
      };

      Object.defineProperty(this._appContext.services, name, {
        get() {
          throw new Error(
            `Service '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other services that access it.`
          );
        },
        configurable: true,
      });
    }

    // Merge with existing fields if overwriting.
    this._registeredServices[name].fn = service;

    if (config.options !== undefined) {
      this._registeredServices[name].options = config.options;
    }

    return this;
  }

  /**
   * Takes a function that configures the app before it is connected.
   * This function is called after services have been created, before the first route match.
   *
   * If the function returns a Promise, the app will not be connected until the Promise resolves.
   */
  beforeConnect(fn) {
    this._onBeforeConnect = async () => {
      const ctx = {
        services: this._appContext.services,
        debug: this._appContext.debug.makeChannel("woof:app:beforeConnect"),
      };

      return fn.call(ctx, ctx);
    };

    return this;
  }

  /**
   * Takes a function that configures the app after it is connected.
   * This function is called after the first route match.
   */
  afterConnect(fn) {
    this._onAfterConnect = async () => {
      const ctx = {
        services: this._appContext.services,
        debug: this._appContext.debug.makeChannel("woof:app:afterConnect"),
      };

      return fn.call(ctx, ctx);
    };

    return this;
  }

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

    this._root = element;

    // Create registered services.
    for (const name in this._registeredServices) {
      const service = this._registeredServices[name];

      // First bits of app code are run; service functions called.
      service.instance = initService(
        this._appContext,
        service.fn,
        this._appContext.debug.makeChannel(`service:${name}`),
        {
          name,
          options: service.options,
        }
      );

      Object.defineProperty(this._appContext.services, name, {
        value: service.instance.exports,
        writable: false,
        configurable: false,
      });
    }

    // beforeConnect is the first opportunity to access other services.
    // This is also a good place to configure things before app-level `setup` runs.
    for (const name in this._registeredServices) {
      this._registeredServices[name].instance.beforeConnect();
    }

    return this._onBeforeConnect().then(async () => {
      // Send connected signal to all services.
      for (const name in this._registeredServices) {
        this._registeredServices[name].instance.afterConnect();
      }

      return this._onAfterConnect();
    });
  }
}
