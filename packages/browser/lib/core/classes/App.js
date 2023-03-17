import { Type, Router } from "@borf/bedrock";

import { merge } from "../helpers/merge.js";
import { DialogStore } from "../stores/dialog.js";
import { HTTPStore } from "../stores/http.js";
import { LanguageStore } from "../stores/language.js";
import { PageStore } from "../stores/page.js";
import { RouterStore } from "../stores/router.js";
import { CrashCollector } from "./CrashCollector.js";

import { DebugHub } from "./DebugHub.js";
import { Store } from "./Store.js";
import { View } from "./View.js";
import { m } from "./Markup.js";

const DefaultRoot = View.define({
  label: "root",
  setup: (ctx) => ctx.outlet(),
});

export class App {
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
  #languages = new Map();
  #rootView = DefaultRoot;
  #currentLanguage;
  #appContext;
  #elementContext = {
    stores: new Map(),
  };

  #options = {
    debug: {
      filter: "*,-borf:*",
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

    if (!Type.isObject(options)) {
      throw new TypeError(`App options must be an object. Got: ${options}`);
    }

    // Merge options with defaults.
    options = merge(this.#options, options);

    // Pass router store the inputs it needs to match routes.
    const routerStore = this.#stores.get("router");
    this.#stores.set("router", {
      ...routerStore,
      inputs: {
        options: options.router,
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

        instance.connect(this.#appContext.rootElement);
      },
      crashPage: options.crashPage,
    });

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      crashCollector,
      debugHub: new DebugHub({ ...options.debug, crashCollector }),
      stores: this.#stores,
      options,
      rootElement: null,
      rootView: null,
      router: new Router(),
      // $dialogs - added by @dialog global
    };
  }

  addRootView(view) {
    if (this.#rootView != DefaultRoot) {
      this.#appContext.debugHub
        .channel("borf:App")
        .warn(`Root view is already defined. The latest call will override previous root view.`);
    }

    if (Type.isFunction(view)) {
      this.#rootView = View.define({ label: "root", setup: view });
    } else if (View.isView(view)) {
      this.#rootView = view;
    } else {
      throw new TypeError(`Expected a View or a standalone setup function. Got type: ${Type.of(view)}, value: ${view}`);
    }

    return this;
  }

  addRoute(pattern, view, extend) {
    Type.assertString(pattern, "Pattern must be a string. Got type: %t, value: %v");

    if (view === null) {
      Type.assertFunction(extend, "An extend callback must be passed when `view` is null. Got type: %t, value: %v");
    }

    this.#prepareRoute({ pattern, view, extend }).forEach((route) => {
      this.#appContext.router.addRoute(route.pattern, route.meta);
    });

    return this;
  }

  addRedirect(pattern, redirect) {
    if (!Type.isFunction(redirect) && !Type.isString(redirect)) {
      throw new TypeError(`Expected a redirect path or function. Got type: ${Type.of(redirect)}, value: ${redirect}`);
    }

    if (Type.isString(redirect)) {
      // TODO: Crash app if redirect path doesn't match. Ideally prevent this before the app starts running.
    }

    this.#prepareRoute({ pattern, redirect }).forEach((route) => {
      this.#appContext.router.addRoute(route.pattern, route.meta);
    });

    return this;
  }

  addStore(store, options) {
    if (Type.isFunction(store)) {
      store = Store.define({ setup: store });
    }

    Type.assert(Store.isStore(store), "Expected a Store or a standalone setup function. Got type: %t, value: %v");

    this.#stores.set(store, this.#prepareStore(store, options));

    return this;
  }

  addLanguage(tag, config) {
    this.#languages.set(tag, config);

    return this;
  }

  setLanguage(tag, fallback) {
    if (tag === "auto") {
      let tags = [];

      if (typeof navigator === "object") {
        if (navigator.languages?.length > 0) {
          tags.push(...navigator.languages);
        } else if (navigator.language) {
          tags.push(navigator.language);
        } else if (navigator.browserLanguage) {
          tags.push(navigator.browserLanguage);
        } else if (navigator.userLanguage) {
          tags.push(navigator.userLanguage);
        }
      }

      for (const tag of tags) {
        if (this.#languages.has(tag)) {
          // Found a matching language.
          this.#currentLanguage = tag;
          return this;
        }
      }

      if (!this.#currentLanguage && fallback) {
        if (this.#languages.has(fallback)) {
          this.#currentLanguage = fallback;
        }
      }
    } else {
      // Tag is the actual tag to set.
      if (this.#languages.has(tag)) {
        this.#currentLanguage = tag;
      } else {
        throw new Error(`Language '${tag}' has not been added to this app yet.`);
      }
    }

    return this;
  }

  /**
   * Initializes globals and connects the app as a child of `element`.
   *
   * @param element - A selector string or a DOM node to attach to. If a string, follows the same format as that taken by `document.querySelector`.
   */
  async connect(element) {
    if (Type.isString(element)) {
      element = document.querySelector(element);
      Type.assertInstanceOf(Node, element, `Selector string '${element}' did not match any element.`);
    }

    Type.assertInstanceOf(Node, element, "Expected a DOM node or a selector string. Got type: %t, value: %v");

    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    appContext.rootElement = element;

    // Pass language options to language store.
    const language = this.#stores.get("language");
    this.#stores.set("language", {
      ...language,
      inputs: {
        languages: Object.fromEntries(this.#languages.entries()),
      },
    });

    // Initialize global stores.
    for (let [key, item] of this.#stores.entries()) {
      const { store, inputs, exports } = item;

      // Channel prefix is displayed before the global's name in console messages that go through a debug channel.
      // Built-in globals get an additional 'fronte:' prefix so it's clear messages are from the framework.
      // 'fronte:*' messages are filtered out by default, but this can be overridden with the app's `debug.filter` option.
      const channelPrefix = Type.isString(key) ? "fronte:store" : "store";
      const label = Type.isString(key) ? key : store.label || store.name;
      const config = {
        appContext,
        elementContext,
        channelPrefix,
        label,
        inputs,
      };

      let instance;

      if (exports) {
        if (Store.isStore(exports)) {
          instance = new exports({
            ...config,
            label: exports.label ?? config.label,
            about: exports.about,
            inputDefs: exports.inputs,
          });
        } else if (Type.isFunction(exports)) {
          instance = new Store({ ...config, setup: exports });
        } else if (Type.isObject(exports)) {
          instance = new Store({ ...config, setup: () => exports });
        }

        Type.assertInstanceOf(Store, instance, "Value of 'exports' is not a valid store. Got type: %t, value: %v");
      } else {
        instance = new store({ ...config, label: store.label, about: store.about, inputDefs: store.inputs });
      }

      // Add instance and mark as ready.
      this.#stores.set(key, { ...item, instance });
    }

    const storeParent = document.createElement("div");

    // beforeConnect is the first opportunity to configure globals before anything else happens.
    for (const { instance } of this.#stores.values()) {
      await instance.connectManual(storeParent);

      Type.assertObject(instance.exports, "Store setup function must return an object. Got type: %t, value: %v");
    }

    // Then the app-level preload function runs (if any), resolving to initial inputs for the app-level view.
    // The preload process for routes is handled by the @router global.
    return this.#preload().then(async (inputs) => {
      // Then the view is initialized and connected to root element.

      appContext.rootView = new this.#rootView({
        appContext,
        elementContext,
        inputs,
        label: this.#rootView.label || "root",
      });

      appContext.rootView.connect(appContext.rootElement);

      // Then stores receive the connected signal. This notifies `router` to start listening for route changes.
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
    const channel = appContext.debugHub.channel("fronte:app:preload");

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

      if (!Type.isPromise(result)) {
        throw new TypeError(`Preload function must return a Promise.`);
      }

      result.then((attributes) => {
        if (attributes && !Type.isObject(attributes)) {
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
    if (Store.isStore(store)) {
      store = { store };
    }

    // Allow overrides of built in stores.
    if (Type.isString(store.store)) {
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
    if (!Type.isObject(route) || !Type.isString(route.pattern)) {
      throw new TypeError(`Route configs must be objects with a 'pattern' string property. Got: ${route}`);
    }

    const parts = Router.splitPath(route.pattern);

    // Remove trailing wildcard for joining with nested routes.
    if (parts[parts.length - 1] === "*") {
      parts.pop();
    }

    const routes = [];

    if (route.redirect) {
      let redirect = route.redirect;

      if (Type.isString(redirect)) {
        redirect = Router.resolvePath(...parts, redirect);

        if (!redirect.startsWith("/")) {
          redirect = "/" + redirect;
        }
      }

      routes.push({
        pattern: route.pattern,
        meta: {
          redirect,
        },
      });

      return routes;
    }

    // Make sure the `view` is the correct type if passed.
    if (route.view && !View.isView(route.view) && !Type.isFunction(route.view)) {
      console.warn(route.view);
      throw new TypeError(
        `Route '${route.pattern}' needs a setup function or a subclass of View for 'view'. Got: ${route.view}`
      );
    }

    const markup = m(route.view || ((ctx) => ctx.outlet()));
    const layer = { id: this.#layerId++, view: markup };

    // Parse nested routes if they exist.
    if (route.extend) {
      const router = {
        addRoute: (pattern, view, extend) => {
          pattern = Router.joinPath([...parts, pattern]);
          routes.push(...this.#prepareRoute({ pattern, view, extend }));
          return router;
        },
        addRedirect: (pattern, redirect) => {
          pattern = Router.joinPath([...parts, pattern]);
          routes.push(...this.#prepareRoute({ pattern, redirect }));
          return router;
        },
      };

      route.extend(router);
    } else {
      routes.push({
        pattern: route.pattern,
        meta: {
          pattern: route.pattern,
          layers: [...layers, layer],
        },
      });
    }

    return routes;
  }
}
