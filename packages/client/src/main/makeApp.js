import { createHashHistory, createBrowserHistory } from "history";
import { makeRouter } from "@woofjs/router";
import { isFunction, isString, isService, isComponent } from "../_helpers/typeChecking";
import { makeDolla } from "./dolla/makeDolla";
import catchLinks from "../_helpers/catchLinks";
import { joinPath } from "../_helpers/joinPath";
import { makeComponent } from "./makeComponent.js";

import DebugService from "./services/@debug";
import HTTPService from "./services/@http";
import PageService from "./services/@page";

// Just a working location for this.
function makeDOM(node) {
  const { element } = node;
  let dom;

  if (element.tag === ":text:") {
    if (element.children.some((x) => !isString(x))) {
      throw new Error(`All children of a :text: node must be strings.`);
    }
    dom = document.createTextNode(element.children.length > 0 ? element.children.join(" ") : "");
    return dom;
  } else if (element.tag === ":fragment:") {
    dom = document.createDocumentFragment();

    for (const child of children) {
      dom.appendChild(makeDOM(child));
    }
    return;
  }

  dom = document.createElement(element.tag);

  const children = [];

  return {
    connect(parent, after) {
      const wasConnected = dom.parentNode != null;

      if (!wasConnected) {
        node.beforeConnect();

        let after;
        for (const node of element.children) {
          const child = makeDOM(node);
          children.push(child);
          child.connect(dom, after);
          after = child;
        }
      }

      parent.insertBefore(dom, after ? after.nextSibling : null);

      if (!wasConnected) {
        node.connected();
      }
    },
    disconnect() {
      if (dom.parentNode) {
        node.beforeDisconnect();
        dom.parentNode.removeChild(dom);

        while (children.length > 0) {
          const child = children.pop();
          child.disconnect();
        }

        node.disconnected();
      }
    },
  };
}

export function makeApp(options = {}) {
  const router = makeRouter();
  const services = {};

  let servicesCreated = false;
  let setup = async () => true;
  let history;
  let outlet;
  let mounted;
  let debug;
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
     * TODO: Plugins
     */
    use(fn) {
      fn({
        route: () => {},
        service: () => {},
        setup: () => {}, // Await all plugin setup functions async - don't let them depend on other plugins
      });

      return methods;
    },

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
     * Registers a service on the app. Services can be referenced on
     * Services and Components using `this.service(name)`.
     *
     * @param name - Unique string to name this service.
     * @param service - A service. One instance will be created and shared.
     * @param options - Object to be passed to service.created() function when called.
     */
    service(name, service, options) {
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
     * If the function returns
     * a Promise, the app will not be started until the Promise resolves.
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

        service.instance = service.template.create(getService, service.options);
      }

      // Restrict service access until all have been created
      servicesCreated = true;

      debug = getService("@debug").channel("woof:app");
      dolla = makeDolla({
        getService,
        $route: getService("@page").$route,
      });

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

          debug.log("caught link click: " + href);

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
      // TODO: Specify in error that this is probably a self.getService in the main body of a service function.
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
        const node = matched.props.component.create(getService, dolla, {}, [], $route);

        const mount = (element) => {
          debug.log(element);
          const dom = makeDOM(element);
          debug.log("mounting element", element, dom);

          if (mounted) {
            mounted.disconnect();
          }
          mounted = dom;
          mounted.connect(outlet);

          // mounted.$element.dataset.appRoute = $route.get("route");
        };

        node.component.preload(mount).then(() => {
          mount(node.element);
        });
      }
    } else {
      console.warn(`No route was matched. Consider adding a wildcard ("*") route to catch this.`);
    }
  }

  ////
  // Built-in services
  ////

  methods.service("@debug", DebugService, options.debug);
  methods.service("@http", HTTPService);
  methods.service("@page", PageService, { history });

  return methods;
}
