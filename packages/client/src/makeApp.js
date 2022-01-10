import { createHashHistory, createBrowserHistory } from "history";
import { makeRouter } from "@woofjs/router";
import { makeDolla } from "./dolla/makeDolla.js";
import { makeDebug } from "./debug/makeDebug.js";
import { makeComponent } from "./makeComponent.js";
import { makeService } from "./makeService.js";
import { isFunction, isString, isService, isComponent } from "./helpers/typeChecking.js";
import { joinPath } from "./helpers/joinPath.js";
import catchLinks from "./helpers/catchLinks.js";

import HTTPService from "./services/@http.js";
import PageService from "./services/@page.js";

export function makeApp(options = {}) {
  const router = makeRouter();
  const debug = makeDebug(options.debug);
  const appDebug = debug.makeChannel("woof:app");
  const services = {};

  let servicesCreated = false;
  let setup = async () => true;
  let history;
  let outlet;
  let mounted;

  let dolla;

  if (options.history) {
    history = options.history;
  } else if (options.hash) {
    history = createHashHistory();
  } else {
    history = createBrowserHistory();
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
     */
    route(path, component) {
      if (isFunction(component)) {
        component = makeComponent(component);
      }

      if (!isComponent(component)) {
        throw new TypeError(`Route needs a path and a component. Got: ${path} and ${component}`);
      }

      router.on(path, { component });

      return methods;
    },

    /**
     * Registers a service on the app. Services can be referenced in
     * Services and Components using `self.getService(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - A service. One instance will be created and shared.
     * @param options - Object to be passed to service.created() function when called.
     */
    service(name, service, options) {
      if (isFunction(service)) {
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
     * Takes a function that configures the app before it starts.
     * This function is called after services have been created
     *
     * If the function returns a Promise, the app will not be started until the Promise resolves.
     *
     * @param fn - App config function.
     */
    setup(fn) {
      setup = async () => fn(getService);

      return methods;
    },

    /**
     * Initializes the app and starts routing.
     *
     * @param element - Selector string or DOM node to attach to.
     */
    connect(element) {
      if (isString(element)) {
        element = document.querySelector(element);
      }

      if (element instanceof Node == false) {
        throw new TypeError(`Expected a DOM node. Received: ${element}`);
      }

      outlet = element;

      for (const name in services) {
        const service = services[name];

        // First bits of app code are run; service functions called.
        service.instance = service.template.create({
          getService,
          debug: debug.makeChannel(`service:${name}`),
          options: service.options,
        });
      }

      // Unlock getService now that all services have been created.
      servicesCreated = true;

      dolla = makeDolla({
        getService,
        debug,
        $route: getService("@page").$route,
      });

      // beforeConnect is the first opportunity to access other services.
      // This is also a good place to configure things before app-level `setup` runs.
      for (const name in services) {
        services[name].instance.beforeConnect();
      }

      setup().then(() => {
        history.listen(onRouteChanged);
        onRouteChanged(history);

        for (const name in services) {
          services[name].instance.connected();
        }

        catchLinks(outlet, (anchor) => {
          let href = anchor.getAttribute("href");

          if (!/^https?:\/\/|^\//.test(href)) {
            href = joinPath(history.location.pathname, href);
          }

          appDebug.log("caught link click: " + href);

          history.push(href);
        });
      });
    },
  };

  ////
  // Private
  ////

  /**
   * Returns the requested service or throws an error if it isn't registered.
   * Every component and service in the app accesses services through this function.
   *
   * @example getService("@page").$title.set("New Page Title")
   *
   * @param name - Name of a service. Built-in services start with `@`.
   */
  function getService(name) {
    if (!servicesCreated) {
      // TODO: Specify in error that this is probably exclusive to calling self.getService in the main body of a service function.
      throw new Error(`A service was requested before it was created. Got: ${name}`);
    }

    if (services[name]) {
      return services[name].instance.exports;
    }

    throw new Error(`Service is not registered in this app. Got: ${name}`);
  }

  /**
   * Switches or sets everything that needs switching or setting when the URL changes.
   */
  function onRouteChanged({ location }) {
    const matched = router.match(location.pathname + location.search);

    if (matched) {
      const { $route } = getService("@page");
      const routeChanged = matched.route !== $route.get("route");

      // Top level route details are stored on @page, where they can be read by apps and services.
      // Nested route info is found in `this.$route` in components.
      $route.set((current) => {
        current.path = matched.path;
        current.route = matched.route;
        current.params = matched.params;
        current.query = matched.query;
        current.wildcard = matched.wildcard;
      });

      if (routeChanged) {
        const node = matched.props.component.create({
          getService,
          dolla,
          debug: debug.makeChannel("component:~"), // TODO: Figure out how to default-name components
          attrs: {},
          children: [],
          $route,
        });

        const mount = (element) => {
          if (mounted) {
            mounted.disconnect();
          }
          mounted = element;
          mounted.connect(outlet);

          // Components store their whole $Element under `element`. We need one extra level of unwrapping to get to the DOM node.
          const dom = mounted.isComponent ? mounted.element.element : mounted.element;
          if (dom) {
            dom.dataset.appRoute = $route.get("route");
          }
        };

        let start = Date.now();
        node.preload(mount).then(() => {
          const time = Date.now() - start;

          mount(node);
          appDebug.log(`[depth 0] mounted route '${matched.route}' - preloaded in ${time}ms`);
        });
      }
    } else {
      appDebug.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  ////
  // Built-in services
  ////

  methods.service("@debug", () => debug); // expose debug as a service
  methods.service("@http", HTTPService);
  methods.service("@page", PageService, { history });

  return methods;
}
