import type { DebugOptions } from "./DebugHub.js";
import type { StopFunction } from "./Writable.js";
import type { InputValues } from "./Inputs.js";
import type { StoreConstructor, StoreSetupFunction, Storable } from "./Store.js";
import type { ViewConstructor, ViewSetupFunction, Viewable } from "./View.js";

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

interface AddStoreOptions<I> {
  inputs?: InputValues<I>;
}

interface AppOptions {
  /**
   * Options for the debug system.
   */
  debug?: DebugOptions;

  /**
   * Options to configure how routing works.
   */
  router?: {
    /**
     * Use hash-based routing if true.
     */
    hash?: boolean;

    /**
     * A history object from the `history` package.
     *
     * @see https://www.npmjs.com/package/history
     */
    history?: History;
  };
}

export interface AppContext {
  crashCollector: CrashCollector;
  debugHub: DebugHub;
  router: Router;
  stores: Map<BuiltInStores | StoreRegistration["store"], StoreRegistration>;
  options: AppOptions;
  rootElement?: Node;
  rootView?: ViewConstructor<{}>;
}

export interface ElementContext {
  stores: Map<StoreRegistration["store"], StoreRegistration>;
}

export interface ElementContext {}

export type BuiltInStores = "http" | "router" | "page" | "language" | "dialog";

// TODO: Is there a good way to represent infinitely nested recursive types?
/**
 * An object where values are either a translated string or another nested Translation object.
 */
type Translation = Record<string, string | Record<string, string | Record<string, string | Record<string, string>>>>;

interface LanguageConfig {
  /**
   * The translated strings for this language, or a callback function that returns them.
   */
  translation: Translation | (() => Translation) | (() => Promise<Translation>);
}

/**
 * TODO: Needs a different name?
 */
interface StoreRegistration<I = any> {
  store: StoreConstructor<I, any>;
  exports?: StoreConstructor<I, any>;
  inputs?: InputValues<I>;
  instance?: Store<I, any>;
}

interface AppRouter {
  /**
   * Adds a new pattern, a view to display while that pattern matches the current URL, and an optional function to configure route chaining.
   * Route chaining allows you to add nested routes and redirects that are displayed within the `view`'s outlet while `pattern` matches the current URL.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - The view to display while `pattern` matches the current URL.
   * @param extend - A callback that takes a router object. Use this to append nested routes and redirects.
   */
  addRoute<I>(pattern: string, view: Viewable<I>, extend?: (sub: AppRouter) => void): this;

  /**
   * Adds a new pattern and chains a set of nested routes that are displayed without a layout `view`.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - Pass null to render subroutes without a parent view.
   * @param extend - A callback that takes a router object. Use this to append nested routes and redirects.
   */
  addRoute(pattern: string, view: null, extend: (sub: AppRouter) => void): this;

  /**
   * Adds a new pattern that will redirect to a different route when matched.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
   */
  addRedirect(pattern: string, redirectPath: string): this;

  /**
   * Adds a new pattern that will redirect to a different route when matched, as calculated by a callback function.
   * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param createPath - A function that generates a redirect path from the current URL match.
   */
  addRedirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;
}

interface RedirectContext {
  /**
   * The path as it appears in the URL bar.
   */
  path: string;

  /**
   * The pattern that this path was matched with.
   */
  pattern: string;

  /**
   * Named route params parsed from `path`.
   */
  params: Record<string, string | number | undefined>;

  /**
   * Query params parsed from `path`.
   */
  query: Record<string, string | number | undefined>;
}

const DefaultRoot = View.define({
  label: "root",
  setup: (ctx) => ctx.outlet(),
});

export class App {
  #layerId = 0;
  #isConnected = false;
  #stopCallbacks: StopFunction[] = [];
  // #activeSubscriptions = [];
  #stores = new Map<BuiltInStores | StoreRegistration["store"], StoreRegistration>([
    ["dialog", { store: DialogStore }],
    ["router", { store: RouterStore }],
    ["page", { store: PageStore }],
    ["http", { store: HTTPStore }],
    ["language", { store: LanguageStore }],
  ]);
  #languages = new Map<string, LanguageConfig>();
  #rootView = DefaultRoot;
  #currentLanguage?: string;
  #appContext: AppContext;
  #elementContext: ElementContext = {
    stores: new Map(),
  };

  #options: AppOptions = {
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

  constructor(options: AppOptions = {}) {
    if (!options) {
      options = {};
    }

    if (!Type.isObject(options)) {
      throw new TypeError(`App options must be an object. Got: ${options}`);
    }

    // Merge options with defaults.
    options = merge(this.#options, options);

    // Pass router store the inputs it needs to match routes.
    const routerStore = this.#stores.get("router")!;
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

        instance.connect(this.#appContext.rootElement!);
      },
      // crashPage: options.crashPage,
    });

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      crashCollector,
      debugHub: new DebugHub({ ...options.debug, crashCollector }),
      stores: this.#stores,
      options,
      router: new Router(),
      // $dialogs - added by @dialog global
    };
  }

  /**
   * Adds a new root view which is displayed by the app at all times.
   * All routes added to the app will render inside this view's `ctx.outlet()`.
   *
   * @param view - A View or a standalone setup function.
   */
  addRootView(view: ViewConstructor<{}> | ViewSetupFunction<{}>) {
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

  /**
   * Adds a new global store which will be available to every component within this App.
   *
   * @param store - A Store or a standalone setup function.
   */
  addStore<I>(store: Storable<I, any>, options: AddStoreOptions<I>) {
    if (Type.isFunction(store)) {
      store = Store.define({ setup: store });
    }

    Type.assert(Store.isStore(store), "Expected a Store or a standalone setup function. Got type: %t, value: %v");

    this.#stores.set(store, this.#prepareStore(store, options));

    return this;
  }

  /**
   * Adds a new language the app can be translated into.
   *
   * @param tag - A valid BCP47 language tag, like `en-US`, `en-GB`, `ja`, etc.
   * @param config - Language configuration.
   */
  addLanguage(tag: string, config: LanguageConfig) {
    this.#languages.set(tag, config);

    return this;
  }

  /**
   * Sets the initial language. The app will default to the first language added if this is not called.
   */
  setLanguage(tag: string): this;

  /**
   * Sets the initial language based on the user's locale.
   * Falls back to `fallback` language if provided, otherwise falls back to the first language added.
   *
   * @param tag - Set to "auto" to autodetect the user's language.
   * @param fallback - The language tag to default to if the app fails to detect an appropriate language.
   */
  setLanguage(tag: "auto", fallback?: string): this;

  setLanguage(tag: string, fallback?: string) {
    if (tag === "auto") {
      let tags = [];

      if (typeof navigator === "object") {
        const nav = navigator as any;

        if (nav.languages?.length > 0) {
          tags.push(...nav.languages);
        } else if (nav.language) {
          tags.push(nav.language);
        } else if (nav.browserLanguage) {
          tags.push(nav.browserLanguage);
        } else if (nav.userLanguage) {
          tags.push(nav.userLanguage);
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
   * Adds a new pattern, a view to display while that pattern matches the current URL, and an optional function to configure nested routes and redirects.
   * Route chaining allows you to add nested routes and redirects that are displayed within the `view`'s outlet while `pattern` matches the current URL.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - The view to display while `pattern` matches the current URL.
   * @param extend - A callback that takes a router to configure nested routes and redirects.
   */
  addRoute<I>(pattern: string, view: Viewable<I>, subroutes?: (sub: AppRouter) => void): this;

  /**
   * Adds a new pattern and a set of nested routes that are displayed without a layout `view`.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - Pass null to render subroutes without a parent view.
   * @param extend - A callback that takes a router to configure nested routes and redirects.
   */
  addRoute(pattern: string, view: null, subroutes: (sub: AppRouter) => void): this;

  addRoute<I>(pattern: string, view: Viewable<I> | null, subroutes?: (sub: AppRouter) => void) {
    Type.assertString(pattern, "Pattern must be a string. Got type: %t, value: %v");

    if (view === null) {
      Type.assertFunction(subroutes, "Sub routes must be defined when `view` is null.");
    }

    this.#prepareRoute({ pattern, view, subroutes }).forEach((route) => {
      this.#appContext.router.addRoute(route.pattern, route.meta);
    });

    return this;
  }

  /**
   * Adds a new pattern that will redirect to a different path when matched.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
   */
  addRedirect(pattern: string, redirectPath: string): this;

  /**
   * Adds a new pattern that will redirect to a different path when matched, as calculated by a callback function.
   * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param createPath - A function that generates a redirect path from the current URL match.
   */
  addRedirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;

  addRedirect(pattern: string, redirect: string | ((ctx: RedirectContext) => string)) {
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

  /**
   * Initializes globals and connects the app as a child of `element`.
   *
   * @param element - A selector string or a DOM node to attach to. If a string, follows the same format as that taken by `document.querySelector`.
   */
  async connect(selector: string | Node) {
    let element: Element | null = null;

    if (Type.isString(selector)) {
      element = document.querySelector(selector);
      Type.assertInstanceOf(Node, element, `Selector string '${selector}' did not match any element.`);
    }

    Type.assertInstanceOf(Node, element, "Expected a DOM node or a selector string. Got type: %t, value: %v");

    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    appContext.rootElement = element!;

    // Pass language options to language store.
    const language = this.#stores.get("language")!;
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
      // Built-in globals get an additional 'borf:' prefix so it's clear messages are from the framework.
      // 'borf:*' messages are filtered out by default, but this can be overridden with the app's `debug.filter` option.
      const channelPrefix = Type.isString(key) ? "borf:store" : "store";
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
      await instance!.connectManual(storeParent);

      Type.assertObject(instance!.exports, "Store setup function must return an object. Got type: %t, value: %v");
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
        await instance!.beforeDisconnect();
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
        await instance!.afterDisconnect();
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
    const channel = appContext.debugHub.channel("borf:app:preload");

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
