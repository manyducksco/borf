import { isFunction, isObject, isStore, isString, isView } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { extendsClass } from "./helpers/extendsClass.js";
import { merge } from "./helpers/merge.js";

import { DebugHub } from "./classes/DebugHub.js";
import { Store } from "./classes/Store.js";
import { View } from "./classes/View.js";
import { m } from "./classes/Markup.js";

import { DialogStore } from "./stores/dialog.js";
import { HTTPStore } from "./stores/http.js";
import { LanguageStore } from "./stores/language.js";
import { PageStore } from "./stores/page.js";
import { RouterStore } from "./stores/router.js";
import { CrashCollector } from "./classes/CrashCollector.js";

export function makeApp(options) {
  return new App(options);
}

class App {
  #layerId = 0;
  #isConnected = false;
  #activeSubscriptions = [];
  #stores = new Map([
    ["dialog", { store: DialogStore }],
    ["router", { store: RouterStore }],
    ["page", { store: PageStore }],
    ["http", { store: HTTPStore }],
    ["language", { store: LanguageStore }],
  ]);
  #routes = [];
  #appContext;
  #elementContext = {
    stores: new Map(),
  };

  #options = {
    preload: null,
    view: (ctx) => ctx.outlet(),
    stores: [],
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
    language: {},
  };

  get isConnected() {
    return this.#isConnected;
  }

  constructor(options) {
    if (!options) {
      options = {};
    }

    if (!isObject(options)) {
      throw new TypeError(`App options must be an object. Got: ${options}`);
    }

    // Merge options with defaults.
    this.#options = merge(this.#options, options);

    for (const route of this.#options.routes) {
      this.#routes.push(...this.#prepareRoute(route));
    }

    for (const store of this.#options.stores) {
      this.#stores.set(store, this.#prepareStore(store));
    }

    // Pass language options to language store.
    const language = this.#stores.get("language");
    this.#stores.set("language", { ...language, attrs: this.#options.language });

    // Pass router store the attrs it needs to match routes.
    const router = this.#stores.get("router");
    this.#stores.set("router", {
      ...router,
      attrs: {
        routes: this.#routes,
        options: this.#options.router,
      },
    });

    // options.crashPage can be
    // - boolean; true to enable, false to disable
    // - "onlyDev"; enable when running locally but disable for production builds
    // - a view; crash page view

    // Crash collector is used by components to handle crashes and errors.
    const crashCollector = new CrashCollector({
      disconnectApp: () => this.disconnect(),
      connectView: (markup) => {
        const instance = markup.init({
          appContext: this.#appContext,
          elementContext: this.#elementContext,
        });

        console.log({ instance, rootElement: this.#appContext.rootElement });

        // TODO: This is somehow leading to a Markup being passed as an HTML attribute.
        instance.connect(this.#appContext.rootElement);
      },
      crashPage: this.#options.crashPage,
    });

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      crashCollector,
      debugHub: new DebugHub({ ...this.#options.debug, crashCollector }),
      stores: this.#stores,
      options: this.#options,
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
    const elementContext = this.#elementContext;

    appContext.rootElement = element;

    // Initialize global stores.
    for (let [key, item] of this.#stores.entries()) {
      const { store, attrs, exports } = item;

      // Channel prefix is displayed before the global's name in console messages that go through a debug channel.
      // Built-in globals get an additional 'woofe:' prefix so it's clear messages are from the framework.
      // 'woofe:*' messages are filtered out by default, but this can be overridden with the app's `debug.filter` option.
      const channelPrefix = isString(key) ? "woofe:store" : "store";
      const label = isString(key) ? key : store.label || store.name;
      const config = {
        appContext,
        elementContext,
        channelPrefix,
        label,
        attributes: attrs,
      };

      let instance;

      if (exports) {
        if (isStore(exports)) {
          instance = new exports({
            ...config,
            label: exports.label,
            about: exports.about,
            attributeDefs: exports.attrs,
          });
        }

        if (isFunction(exports)) {
          instance = new Store({ ...config, setup: exports });
        }

        if (isObject(exports)) {
          instance = new Store({ ...config, setup: () => exports });
        }

        if (!instance || !(instance instanceof Store) || !isObject(instance?.exports)) {
          throw new TypeError(`Value of 'exports' didn't result in a usable store. Got: ${exports}`);
        }
      } else {
        instance = new store({ ...config, about: store.about, attributeDefs: store.attrs });
      }

      // Stores must have a setup function that returns an object. That is the object you get by calling `ctx.useStore()`.
      if (!isObject(instance?.exports)) {
        throw new TypeError(`Setup function for store '${label}' did not return an object.`);
      }

      // Add instance and mark as ready.
      this.#stores.set(key, { ...item, instance, ready: true });
    }

    // beforeConnect is the first opportunity to configure globals before anything else happens.
    for (const { instance } of this.#stores.values()) {
      await instance.beforeConnect();
    }

    // Then the app-level preload function runs (if any), resolving to initial attributes for the app-level view.
    // The preload process for routes is handled by the @router global.
    return this.#preload().then(async (attributes) => {
      // Then the view is initialized and connected to root element.
      if (isFunction(this.#options.view)) {
        appContext.rootView = new View({
          appContext,
          elementContext,
          attributes,
          setup: this.#options.view,
          label: "app",
        });
      } else if (extendsClass(View, this.#options.view)) {
        const view = this.#options.view;
        appContext.rootView = new this.#options.view({
          appContext,
          elementContext,
          attributes,
          label: view.label ?? view.name ?? "app",
        });
      }

      appContext.rootView.connect(appContext.rootElement);

      // Then we initialize the dialog container for the @dialog global.
      // This subscription manages the actual DOM nodes behind the data in the @dialog global.
      this.#activeSubscriptions.push(connectDialogs(appContext));

      // Then stores receive the afterConnect signal. This notifies `router` to start listening for route changes.
      for (const { instance } of this.#stores.values()) {
        await instance.afterConnect();
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

      // Send beforeDisconnect signal to stores.
      for (const { instance } of this.#stores.values()) {
        await instance.beforeDisconnect();
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

      // Send final afterDisconnect signal to stores.
      for (const { instance } of this.#stores.values()) {
        await instance.afterDisconnect();
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
    const elementContext = this.#elementContext;
    const channel = appContext.debugHub.channel("woofe:app:preload");

    return new Promise((resolve) => {
      let resolved = false;

      const ctx = {
        ...channel,

        useStore: (store) => {
          const name = store?.name || store;

          if (elementContext.stores.has(store)) {
            if (appContext.stores.has(store)) {
              // Warn if shadowing a global, just in case this isn't intended.
              channel.warn(`Using local store '${name}' which shadows global store '${name}'.`);
            }

            return elementContext.stores.get(store).instance.exports;
          }

          if (appContext.stores.has(store)) {
            const _store = appContext.stores.get(store);

            if (!_store.instance) {
              throw new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' appears earlier in the 'stores' array than other stores that access it.`
              );
            }

            return _store.instance.exports;
          }

          throw new Error(`Store '${name}' is not registered on this app.`);
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

  #prepareStore(store) {
    if (isStore(store)) {
      store = { store };
    }

    // Allow overrides of built in stores.
    if (isString(store.store)) {
      if (!store.exports) {
        throw new Error(`Tried to override '${store.store}' store without passing a value for 'exports'.`);
      }

      store = { ...store };

      store.store = store.exports;
      store.exports = undefined;
    }

    store.ready = false;

    return store;
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
