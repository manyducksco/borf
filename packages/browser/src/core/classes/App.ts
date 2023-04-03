import { Type, Router } from "@borf/bedrock";

import { merge } from "../helpers/merge.js";
import { DialogStore } from "../stores/dialog.js";
import { HTTPStore } from "../stores/http.js";
import { LanguageStore, type LanguageConfig } from "../stores/language.js";
import { PageStore } from "../stores/page.js";
import { RouterStore, type RouterOptions } from "../stores/router.js";
import { CrashCollector } from "./CrashCollector.js";

import { DebugHub, type DebugOptions } from "./DebugHub.js";
import { type StopFunction } from "./Writable.js";
import { type InputValues } from "./Inputs.js";
import { Store, type StoreConstructor, type Storable, StoreSetupFunction } from "./Store.js";
import { View, type ViewConstructor, type Viewable, ViewSetupFunction } from "./View.js";
import { m } from "./Markup.js";

// ----- Types ----- //

/**
 * Options passed when registering a store with `addStore`.
 */
interface AddStoreOptions<I> {
  /**
   * Inputs to pass to this store when it is created.
   */
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
  router?: RouterOptions;
}

export interface AppContext {
  crashCollector: CrashCollector;
  debugHub: DebugHub;
  stores: Map<BuiltInStores | StoreRegistration["store"], StoreRegistration>;
  rootElement?: HTMLElement;
  rootView?: View<{}>;
}

export interface ElementContext {
  stores: Map<StoreRegistration["store"], StoreRegistration>;
  isSVG?: boolean;
}

/**
 * Stores provided by the app. Accessible in components by these names with `ctx.useStore(name)`.
 */
export type BuiltInStores = "http" | "router" | "page" | "language" | "dialog";

/**
 * An object kept in App for each store registered with `addStore`.
 */
export interface StoreRegistration<I = any> {
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
   * @param subroutes - A callback that takes a router object. Use this to append nested routes and redirects.
   */
  addRoute<I>(pattern: string, view: Viewable<I>, subroutes?: (router: AppRouter) => void): this;

  /**
   * Adds a new pattern and chains a set of nested routes that are displayed without a layout `view`.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - Pass null to render subroutes without a parent view.
   * @param subroutes - A callback that takes a router object. Use this to append nested routes and redirects.
   */
  addRoute(pattern: string, view: null, subroutes: (router: AppRouter) => void): this;

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

// ----- Code ----- //

/**
 * The default root view. This is used when no root view is provided to the app.
 * It does nothing but render routes.
 */
const DefaultRoot = View.define({
  label: "root",
  setup: (ctx) => ctx.outlet(),
});

/**
 * A Borf browser app, complete with routes, stores, and multiple language support.
 */
export class App implements AppRouter {
  #layerId = 0;
  #isConnected = false;
  #stopCallbacks: StopFunction[] = [];
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
      log: "development", // Only print logs in development.
      warn: "development", // Only print warnings in development.
      error: true, // Always print errors.
    },
    router: {
      hash: false,
    },
  };

  // Routes are prepared by the app and added to this router,
  // which is passed to and used by the `router` store to handle navigation.
  #router = new Router();

  /**
   * Whether the app is connected to the DOM.
   */
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

    // Crash collector is used by components to handle crashes and errors.
    const crashCollector = new CrashCollector();

    // When an error of "crash" severity is reported by a component,
    // the app is disconnected and a crash page is connected.
    crashCollector.onError(async ({ error, severity, componentLabel }) => {
      // Disconnect app and connect crash page on "crash" severity.
      if (severity === "crash") {
        await this.disconnect();

        const instance = new DefaultCrashPage({
          appContext: this.#appContext,
          elementContext: this.#elementContext,
          channelPrefix: "crash",
          label: DefaultCrashPage.label || DefaultCrashPage.name,
          about: DefaultCrashPage.about,
          inputs: {
            message: error.message,
            error: error,
            componentLabel,
          },
          inputDefs: DefaultCrashPage.inputs,
        });

        instance.connect(this.#appContext.rootElement!);
      }
    });

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      crashCollector,
      debugHub: new DebugHub({ ...options.debug, crashCollector }),
      stores: this.#stores,
      // $dialogs - added by dialog store
    };
  }

  /**
   * Adds a new root view which is displayed by the app at all times.
   * All routes added to the app will render inside this view's `ctx.outlet()`.
   *
   * @param view - A View or a standalone setup function.
   */
  addRootView(view: Viewable<{}>) {
    if (this.#rootView != DefaultRoot) {
      this.#appContext.debugHub
        .channel("borf:App")
        .warn(`Root view is already defined. Only the final addRootView call will take effect.`);
    }

    if (Type.isFunction(view)) {
      this.#rootView = View.define({ label: "root", setup: view as ViewSetupFunction<{}> });
    } else if (View.isView(view)) {
      this.#rootView = view as ViewConstructor<{}>;
    } else {
      throw new TypeError(`Expected a View or a standalone setup function. Got type: ${Type.of(view)}, value: ${view}`);
    }

    return this;
  }

  addStore(config: StoreRegistration): this;

  /**
   * Adds a new global store which will be available to every component within this App.
   *
   * @param store - A Store or a standalone setup function.
   */
  addStore<I>(store: Storable<I, any> | StoreRegistration, options?: AddStoreOptions<I>) {
    let config: StoreRegistration | undefined;

    if (Store.isStore(store)) {
      config = { store: store as StoreConstructor<I, any>, ...options };
    } else if (Type.isFunction(store)) {
      config = { store: Store.define({ setup: store as StoreSetupFunction<any, any> }) };
    } else if (Type.isObject(store)) {
      config = store as StoreRegistration;
    } else {
      throw new TypeError(
        `Expected a Store or Store registration object. Got type: ${Type.of(store)}, value: ${store}`
      );
    }

    Type.assertExtends(
      Store,
      store,
      "Expected a Store, store config object or a standalone setup function. Got type: %t, value: %v"
    );

    this.#stores.set(config.store, config);

    return this;
  }

  /**
   * Adds a new language translation to the app.
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

  addRoute(pattern: string, view: Viewable<unknown> | null, subroutes?: (sub: AppRouter) => void) {
    Type.assertString(pattern, "Pattern must be a string. Got type: %t, value: %v");

    if (view == null) {
      Type.assertFunction(subroutes, "Sub routes must be defined when `view` is null.");
    }

    this.#prepareRoute({ pattern, view, subroutes }).forEach((route) => {
      this.#router.addRoute(route.pattern, route.meta);
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
      this.#router.addRoute(route.pattern, route.meta);
    });

    return this;
  }

  /**
   * Initializes and connects the app as a child of `element`.
   *
   * @param element - A selector string or a DOM node to attach to. If a string, follows the same format as that taken by `document.querySelector`.
   */
  async connect(selector: string | Node) {
    let element: HTMLElement | null = null;

    if (Type.isString(selector)) {
      element = document.querySelector(selector);
      Type.assertInstanceOf(HTMLElement, element, `Selector string '${selector}' did not match any element.`);
    }

    Type.assertInstanceOf(HTMLElement, element, "Expected a DOM node or a selector string. Got type: %t, value: %v");

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

    // Pass route options to router store.
    const router = this.#stores.get("router")!;
    this.#stores.set("router", {
      ...router,
      inputs: {
        options: this.#options.router,
        router: this.#router,
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
          instance = new Store({ ...config, setup: exports as StoreSetupFunction<any, any> });
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

      Type.assertObject(instance!.outputs, "Store setup function must return an object. Got type: %t, value: %v");
    }

    // Then the view is initialized and connected to root element.

    appContext.rootView = new this.#rootView({
      appContext,
      elementContext,
      label: this.#rootView.label || "root",
      about: this.#rootView.about,
    });

    appContext.rootView.connect(appContext.rootElement);

    // Then stores receive the connected signal. This notifies `router` to start listening for route changes.
    for (const { instance } of this.#stores.values()) {
      instance!.afterConnect();
    }

    // The app is now connected.
    this.#isConnected = true;
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
      await appContext.rootView!.disconnect();

      // The app is considered disconnected at this point.
      this.#isConnected = false;

      // Stop all observers.
      for (const stop of this.#stopCallbacks) {
        stop();
      }
      this.#stopCallbacks = [];

      // Send final afterDisconnect signal to stores.
      for (const { instance } of this.#stores.values()) {
        instance!.afterDisconnect();
      }
    }
  }

  /**
   * Parses a route into a data structure appropriate for route matching.
   *
   * @param route - Route config object.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  #prepareRoute(
    route: {
      pattern: string;
      redirect?: string | ((ctx: RedirectContext) => void);
      view?: Viewable<unknown> | null;
      subroutes?: (router: AppRouter) => void;
    },
    layers = []
  ) {
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
        redirect = Router.resolvePath(Router.joinPath(parts), redirect);

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

    let view: ViewConstructor<unknown> | undefined;

    if (!route.view) {
      view = View.define({
        label: route.pattern,
        setup: (ctx) => ctx.outlet(),
      });
    } else if (View.isView(route.view)) {
      view = route.view;
    } else if (Type.isFunction(route.view) && !Type.isClass(route.view)) {
      view = View.define({
        label: route.pattern,
        setup: route.view as ViewSetupFunction<unknown>,
      });
    }

    if (!View.isView(view)) {
      throw new TypeError(
        `Route '${route.pattern}' needs a setup function or a subclass of View for 'view'. Got: ${route.view}`
      );
    }

    const markup = m(view);
    const layer = { id: this.#layerId++, view: markup };

    // Parse nested routes if they exist.
    if (route.subroutes) {
      const router: AppRouter = {
        addRoute: (pattern: string, view: Viewable<any> | null, subroutes: (router: AppRouter) => void) => {
          pattern = Router.joinPath([...parts, pattern]);
          routes.push(...this.#prepareRoute({ pattern, view, subroutes }));
          return router;
        },
        addRedirect: (pattern, redirect) => {
          pattern = Router.joinPath([...parts, pattern]);
          routes.push(...this.#prepareRoute({ pattern, redirect }));
          return router;
        },
      };

      route.subroutes(router);
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

type CrashPageInputs = {
  message: string;
  error: Error;
  componentLabel: string;
};

const DefaultCrashPage = View.define<CrashPageInputs>({
  label: "DefaultCrashPage",
  setup(ctx, m) {
    const { message, error, componentLabel } = ctx.inputs.get();

    return m(
      "div",
      {
        style: {
          backgroundColor: "#880000",
          color: "#fff",
          padding: "2rem",
          position: "fixed",
          inset: 0,
          fontSize: "20px",
        },
      },
      [
        m("h1", { style: { marginBottom: "0.5rem" } }, "The app has crashed"),

        m(
          "p",
          { style: { marginBottom: "0.25rem" } },
          m("span", { style: { fontFamily: "monospace" } }, componentLabel),
          " says:"
        ),

        m(
          "blockquote",
          {
            style: {
              backgroundColor: "#991111",
              padding: "0.25em",
              borderRadius: "6px",
              fontFamily: "monospace",
              marginBottom: "1rem",
            },
          },
          m(
            "span",
            {
              style: {
                display: "inline-block",
                backgroundColor: "red",
                padding: "0.1em 0.4em",
                marginRight: "0.5em",
                borderRadius: "4px",
                fontSize: "0.9em",
                fontWeight: "bold",
              },
            },
            error.name
          ),
          message
        ),

        m("p", "Please see the browser console for details."),
      ]
    );
  },
});
