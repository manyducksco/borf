import { isFunction, isGlobal, isObject, isString, isView } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { makeDebug } from "./helpers/makeDebug.js";
import { extendsClass } from "./helpers/extendsClass.js";
import { merge } from "./helpers/merge.js";
import { makeGlobal } from "./makeGlobal.js";
import { Global } from "./_experimental/Global.js";
import { ViewBlueprint } from "./blueprints/View.js";
import { m } from "./_experimental/Markup.js";

import dialog from "./globals/@dialog.js";
import http from "./globals/@http.js";
import page from "./globals/@page.js";
import router from "./globals/@router.js";

import { View } from "./_experimental/View.js";

export function makeApp(options) {
  return new App(options);
}

class App {
  #layerId = 0;
  #isConnected = false;
  #activeSubscriptions = [];
  #globals = [
    { name: "@dialog", global: dialog },
    { name: "@router", global: router },
    { name: "@page", global: page },
    { name: "@http", global: http },
  ];
  #routes = [];
  #appContext;

  #options = {
    preload: null,
    view: (ctx) => ctx.outlet(),
    globals: [],
    routes: [],
    debug: {
      filter: "*,-woofe:*",
      log: true,
      warn: true,
      error: true,
    },
    router: {
      hash: false,
    },
  };

  get isConnected() {
    return this.#isConnected;
  }

  constructor(options) {
    if (!options) {
      options = {};
    }

    // Accepts a standalone view setup function.
    if (isFunction(options)) {
      options = {
        view: options,
      };
    }

    if (!isObject(options)) {
      throw new TypeError(`App options must be an object. Got: ${options}`);
    }

    // Merge options with defaults.
    this.#options = merge(this.#options, options);

    // Add globals, making sure to have only one copy of a global with the same name.
    if (this.#options.globals) {
      for (const { name, global } of this.#options.globals) {
        const index = this.#globals.findIndex((x) => x.name === name);
        if (index > -1) {
          this.#globals.splice(index, 1, { name, global });
        } else {
          this.#globals.push({ name, global });
        }
      }
    }

    // Process routes into something the @router can match.
    if (this.#options.routes) {
      this.#routes = [];

      for (const route of this.#options.routes) {
        this.#routes.push(...this.#prepareRoute(route));
      }
    }

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      options: this.#options,
      debug: makeDebug(this.#options.debug ?? {}),
      globals: {},
      routes: this.#routes,
      rootElement: null,
      rootView: null,
      // $dialogs - added by @dialog global
    };
  }

  /**
   * Initializes globals and connects the app as a child of `element`.
   *
   * @param element - A selector string or a DOM node to attach to. If a string, follows the same format as that taken by `document.querySelector`.
   */
  async connect(element) {
    if (isString(element)) {
      element = document.querySelector(element);
    }

    if (!(element instanceof Node)) {
      throw new TypeError(`Expected a DOM node. Got: ${element}`);
    }

    const appContext = this.#appContext;

    appContext.rootElement = element;

    // Set up temporary getters to prevent globals being accessed by other globals before they are initialized.
    // These are overwritten as the real globals are initialized.
    for (const { name } of this.#globals) {
      Object.defineProperty(appContext.globals, name, {
        get() {
          throw new Error(
            `Global '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other globals that access it.`
          );
        },
        configurable: true,
      });
    }

    // Now initialize the real globals.
    for (let { name, global } of this.#globals) {
      // Channel prefix is displayed before the global's name in console messages that go through a debug channel.
      // Built-in globals get an additional 'woofe:' prefix so it's clear messages are from the framework.
      // 'woofe:*' messages are filtered out by default, but this can be overridden with the app's `debug.filter` option.
      let channelPrefix = name.startsWith("@") ? "woofe:global" : "global";

      // Accepts a standalone setup function or a global class.
      if (isGlobal(global)) {
        global = new global({ appContext, channelPrefix, label: global.label || name });
      } else if (isFunction(global)) {
        global = new Global({ appContext, channelPrefix, setup: global });
      } else {
        throw new TypeError(`Global '${name}' must be a global or a global setup function. Got: ${global}`);
      }

      // Globals must have a setup function that returns an object. That is the object you get by calling `ctx.global("name")`.
      if (!isObject(global.exports)) {
        throw new TypeError(`Setup function for global '${name}' did not return an object.`);
      }

      // Add to appContext for access by views and other globals.
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

    // Then the app-level preload function runs (if any), resolving to initial attributes for the app-level view.
    // The preload process for routes is handled by the @router global.
    return this.#preload().then(async (attributes) => {
      // Then the view is initialized and connected to root element.
      if (isFunction(this.#options.view)) {
        appContext.rootView = new View({ appContext, attributes, setup: this.#options.view, label: "app" });
      } else if (extendsClass(View, this.#options.view)) {
        const view = this.#options.view;
        appContext.rootView = new this.#options.view({ appContext, attributes, label: view.label ?? view.name });
      }
      // appContext.rootView = new ViewBlueprint(this.#options.view).build({ appContext, attributes });
      appContext.rootView.connect(appContext.rootElement);

      // Then we initialize the dialog container for the @dialog global.
      // This subscription manages the actual DOM nodes behind the data in the @dialog global.
      this.#activeSubscriptions.push(connectDialogs(appContext));

      // Then globals receive the afterConnect signal. This notifies @router to start listening for route changes.
      for (const global of Object.values(appContext.globals)) {
        global.afterConnect();
      }

      // The app is now connected.
      this.#isConnected = true;
    });
  }

  /**
   * Disconnects views and tears down globals, removing the app from the page.
   */
  async disconnect() {
    if (this.#isConnected) {
      const appContext = this.#appContext;

      // Send beforeDisconnect signal to globals.
      for (const global of Object.values(appContext.globals)) {
        await global.beforeDisconnect();
      }

      // Remove the root view from the page (runs teardown callbacks on all connected views).
      await appContext.rootView.disconnect();

      // The app is considered disconnected at this point.
      this.#isConnected = false;

      // Unsubscribe from all active subscriptions.
      while (this.#activeSubscriptions.length > 0) {
        const sub = this.#activeSubscriptions.shift();
        sub.unsubscribe();
      }

      // Send final afterDisconnect signal to globals.
      for (const global of Object.values(appContext.globals)) {
        global.afterDisconnect();
      }
    }
  }

  /**
   * Runs top level preload callback before the app is connected.
   */
  async #preload() {
    if (!this.#options.preload) {
      return {};
    }

    const appContext = this.#appContext;
    const channel = appContext.debug.makeChannel("woofe:app:preload");

    return new Promise((resolve) => {
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
        redirect: (to) => {
          if (!resolved) {
            // The @router global will start the app at this path when connected.
            appContext.redirectPath = to;
            resolve();
            resolved = true;
          }
        },
      };

      const result = this.#options.preload(ctx);

      if (!isFunction(result.then)) {
        throw new TypeError(`Preload function must return a Promise.`);
      }

      result.then((attributes) => {
        if (attributes && !isObject(attributes)) {
          throw new TypeError(
            `Preload function must return an attributes object or null/undefined. Got: ${attributes}`
          );
        }

        if (!resolved) {
          resolve(attributes);
          resolved = true;
        }
      });
    });
  }

  /**
   * Parses a route into a data structure appropriate for route matching.
   *
   * @param route - Route config object.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  #prepareRoute(route, layers = []) {
    if (!isObject(route) || !isString(route.path)) {
      throw new TypeError(`Route configs must be objects with a 'path' string property. Got: ${route}`);
    }

    const parts = splitRoute(route.path);

    // Remove trailing wildcard for joining with nested routes.
    if (parts[parts.length - 1] === "*") {
      parts.pop();
    }

    const routes = [];

    if (route.redirect) {
      let redirect = resolvePath(...parts, route.redirect);

      if (!redirect.startsWith("/")) {
        redirect = "/" + redirect;
      }

      routes.push({
        path: route.path,
        fragments: parseRoute(route.path).fragments,
        redirect,
      });

      return routes;
    }

    // Make sure the `view` is the correct type if passed.
    if (route.view && !isView(route.view) && !isFunction(route.view)) {
      console.warn(route.view);
      throw new TypeError(
        `Route '${route.path}' needs a setup function or a subclass of View for 'view'. Got: ${route.view}`
      );
    }

    const markup = m(route.view || ((ctx) => ctx.outlet()));
    const layer = { id: this.#layerId++, view: markup };

    // Parse nested routes if they exist.
    if (route.routes) {
      for (const subroute of route.routes) {
        const path = joinPath(...parts, subroute.path);
        routes.push(...this.#prepareRoute({ ...subroute, path }, [...layers, layer]));
      }
    } else {
      routes.push({
        path: route.path,
        fragments: parseRoute(route.path).fragments,
        layers: [...layers, layer],
      });
    }

    return routes;
  }
}

/**
 * Creates a dialog outlet element that gets added to the DOM.
 * This outlet is displayed when there is at least one dialog active and will contain any dialogs that are open.
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

  // Diff dialogs when value is updated, adding and removing dialogs as necessary.
  return $dialogs.subscribe((dialogs) => {
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

      // Container is only connected to the DOM when there is at least one dialog to display.
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
