import {
  assertFunction,
  assertInstanceOf,
  assertString,
  isFunction,
  isObject,
  isString,
  joinPath,
  patternToFragments,
  resolvePath,
  sortRoutes,
  splitPath,
  typeOf,
  type Route,
} from "@borf/bedrock";
import { CrashCollector } from "./CrashCollector.js";
import { DebugHub, type DebugChannel, type DebugOptions } from "./DebugHub.js";
import { DOMHandle, Markup, m } from "./markup.js";
import { type StopFunction } from "./state.js";
import { initStore, type Store } from "./store.js";
import { DialogStore } from "./stores/dialog.js";
import { DocumentStore } from "./stores/document.js";
import { HTTPStore } from "./stores/http.js";
import { LanguageStore, type LanguageConfig } from "./stores/language.js";
import {
  RouterStore,
  type RedirectContext,
  type RouteConfig,
  type RouteLayer,
  type RouterOptions,
} from "./stores/router.js";
import { type BuiltInStores } from "./types.js";
import { merge } from "./utils/merge.js";
import { initView, type View, type ViewContext } from "./view.js";

// ----- Types ----- //

interface AppOptions {
  /**
   * Options for the debug system.
   */
  debug?: DebugOptions;

  /**
   * Options to configure how routing works.
   */
  router?: RouterOptions;

  /**
   * Configures the app based on the environment it's running in.
   */
  mode?: "development" | "production";
}

export interface AppContext {
  crashCollector: CrashCollector;
  debugHub: DebugHub;
  stores: Map<keyof BuiltInStores | StoreRegistration["store"], StoreRegistration>;
  mode: "development" | "production";
  rootElement?: HTMLElement;
  rootView?: DOMHandle;

  /**
   * Perform DOM updates on next animation frame. Returns a promise that resolves once the changes are applied.
   * If a key is passed, only the latest callback in a batch with a specified key will be called.
   */
  queueUpdate: (callback: () => void, key?: string) => void;
}

export interface ElementContext {
  stores: Map<StoreRegistration["store"], StoreRegistration>;
  isSVG?: boolean;
  componentName?: string; // name of the nearest parent component
}

/**
 * An object kept in App for each store registered with `addStore`.
 */
export interface StoreRegistration<O = any> {
  store: Store<O, any>;
  options?: O;
  instance?: ReturnType<typeof initStore>;
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
  route<I>(pattern: string, view: View<I>, subroutes?: (router: AppRouter) => void): this;

  /**
   * Adds a new pattern and chains a set of nested routes that are displayed without a layout `view`.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - Pass null to render subroutes without a parent view.
   * @param subroutes - A callback that takes a router object. Use this to append nested routes and redirects.
   */
  route(pattern: string, view: null, subroutes: (router: AppRouter) => void): this;

  /**
   * Adds a new pattern that will redirect to a different route when matched.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
   */
  redirect(pattern: string, redirectPath: string): this;

  /**
   * Adds a new pattern that will redirect to a different route when matched, as calculated by a callback function.
   * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param createPath - A function that generates a redirect path from the current URL match.
   */
  redirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;
}

interface ConfigureContext {
  // use
}

type ConfigureCallback = (ctx: ConfigureContext) => void | Promise<void>;

// ----- Code ----- //

/**
 * The default root view. This is used when no root view is provided to the app.
 * It does nothing but render routes.
 */

function DefaultRootView(_: {}, ctx: ViewContext) {
  return ctx.outlet();
}

/**
 * A Borf browser app, complete with routes, stores, and multiple-language support.
 */
export class App implements AppRouter {
  #layerId = 0;
  #isConnected = false;
  #stopCallbacks: StopFunction[] = [];
  #stores = new Map<keyof BuiltInStores | Store<any, any>, StoreRegistration>([
    ["dialog", { store: DialogStore }],
    ["router", { store: RouterStore }],
    ["document", { store: DocumentStore }],
    ["http", { store: HTTPStore }],
    ["language", { store: LanguageStore }],
  ]);
  #languages = new Map<string, LanguageConfig>();
  #mainView: Markup = m(DefaultRootView, {});
  #currentLanguage?: string;
  #appContext: AppContext;
  #elementContext: ElementContext = {
    stores: new Map(),
  };
  #debugChannel: DebugChannel;
  #configureCallback?: ConfigureCallback;

  #options: AppOptions = {
    debug: {
      filter: "*,-borf/*",
      log: "development", // Only print logs in development.
      warn: "development", // Only print warnings in development.
      error: true, // Always print errors.
    },
    router: {
      hash: false,
    },
    mode: "production",
  };

  // Routes are prepared by the app and added to this router,
  // which is passed to and used by the `router` store to handle navigation.
  #routes: Route<RouteConfig["meta"]>[] = [];

  // True while the app is actively running DOM updates.
  #updating = false;
  // Keyed updates ensure only the most recent callback queued with a certain key
  // will be called, keeping DOM operations to a minimum.
  #queuedUpdatesKeyed = new Map<string, () => void>();
  // All unkeyed updates are run on every batch.
  #queuedUpdatesUnkeyed: (() => void)[] = [];

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

    if (!isObject(options)) {
      throw new TypeError(`App options must be an object. Got: ${options}`);
    }

    // Merge options with defaults.
    options = merge(this.#options, options);

    // Pass router store the inputs it needs to match routes.
    const routerStore = this.#stores.get("router")!;
    this.#stores.set("router", {
      ...routerStore,
      options: options.router,
    });

    // Crash collector is used by components to handle crashes and errors.
    const crashCollector = new CrashCollector();

    // When an error of "crash" severity is reported by a component,
    // the app is disconnected and a crash page is connected.
    crashCollector.onError(async ({ error, severity, componentName }) => {
      // Disconnect app and connect crash page on "crash" severity.
      if (severity === "crash") {
        await this.disconnect();

        const instance = initView({
          view: DefaultCrashPage,
          appContext: this.#appContext,
          elementContext: this.#elementContext,
          // channelPrefix: "crash",
          props: {
            message: error.message,
            error: error,
            componentName,
          },
        });

        await instance.connect(this.#appContext.rootElement!);
      }
    });

    // And finally create the appContext. This is the central config object accessible to all components.
    this.#appContext = {
      crashCollector,
      debugHub: new DebugHub({ ...options.debug, crashCollector, mode: options.mode! }),
      stores: this.#stores,
      mode: options.mode!,
      // $dialogs - added by dialog store
      queueUpdate: (callback, key) => {
        if (key) {
          this.#queuedUpdatesKeyed.set(key, callback);
        } else {
          this.#queuedUpdatesUnkeyed.push(callback);
        }

        if (!this.#updating && this.isConnected) {
          this.#updating = true;
          this.#runUpdates();
        }
      },
    };

    this.#debugChannel = this.#appContext.debugHub.channel({ name: "borf/App" });
  }

  #runUpdates() {
    const totalQueued = this.#queuedUpdatesKeyed.size + this.#queuedUpdatesUnkeyed.length;

    if (!this.isConnected || totalQueued === 0) {
      this.#updating = false;
    }

    if (!this.#updating) return;

    requestAnimationFrame(() => {
      this.#debugChannel.info(
        `Batching ${this.#queuedUpdatesKeyed.size + this.#queuedUpdatesUnkeyed.length} queued DOM update(s).`
      );

      for (const callback of this.#queuedUpdatesKeyed.values()) {
        callback();
      }
      this.#queuedUpdatesKeyed.clear();

      for (const callback of this.#queuedUpdatesUnkeyed) {
        callback();
      }
      this.#queuedUpdatesUnkeyed = [];

      this.#runUpdates();
    });
  }

  /**
   * Displays view at the root of the app. All other routes render inside this view's outlet.
   */
  main<A extends Record<string, any>>(view: View<A>, attributes?: A) {
    if (this.#mainView.type !== DefaultRootView) {
      this.#debugChannel.warn(`Root view is already defined. Only the final main call will take effect.`);
    }

    if (typeof view === "function") {
      this.#mainView = m(view, attributes);
    } else {
      throw new TypeError(`Expected a view function. Got type: ${typeOf(view)}, value: ${view}`);
    }

    return this;
  }

  /**
   * Makes this store accessible from any other component in the app, except for stores registered before this one.
   */
  store<O>(store: Store<O, any>, options?: O) {
    let config: StoreRegistration | undefined;

    if (isFunction(store)) {
      config = { store, options };
    } else {
      throw new TypeError(`Expected a store function. Got type: ${typeOf(store)}, value: ${store}`);
    }

    assertFunction(store, "Expected a store function or a store config object. Got type: %t, value: %v");

    this.#stores.set(store, config);

    return this;
  }

  /**
   * Adds a new language translation to the app.
   *
   * @param tag - A valid BCP47 language tag, like `en-US`, `en-GB`, `ja`, etc.
   * @param config - Language configuration.
   */
  language(tag: string, config: LanguageConfig) {
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
  route<I>(pattern: string, view: View<I>, subroutes?: (sub: AppRouter) => void): this;

  /**
   * Adds a new pattern and a set of nested routes that are displayed without a layout `view`.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param view - Pass null to render subroutes without a parent view.
   * @param extend - A callback that takes a router to configure nested routes and redirects.
   */
  route(pattern: string, view: null, subroutes: (sub: AppRouter) => void): this;

  route(pattern: string, view: View<unknown> | null, subroutes?: (sub: AppRouter) => void) {
    assertString(pattern, "Pattern must be a string. Got type: %t, value: %v");

    if (view == null) {
      assertFunction(subroutes, "Sub routes must be defined when `view` is null.");
    }

    this.#prepareRoute({ pattern, view, subroutes }).forEach((route) => {
      this.#routes.push({
        pattern: route.pattern,
        meta: route.meta,
        fragments: patternToFragments(route.pattern),
      });
    });

    return this;
  }

  /**
   * Adds a new pattern that will redirect to a different path when matched.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param redirectPath - A path to redirect to when `pattern` matches the current URL.
   */
  redirect(pattern: string, redirectPath: string): this;

  /**
   * Adds a new pattern that will redirect to a different path when matched, as calculated by a callback function.
   * Useful when you require more insight into the path that matched the pattern before deciding where to send the user.
   *
   * @param pattern - A URL pattern to match against the current URL.
   * @param createPath - A function that generates a redirect path from the current URL match.
   */
  redirect(pattern: string, createPath: (ctx: RedirectContext) => string): this;

  redirect(pattern: string, redirect: string | ((ctx: RedirectContext) => string)) {
    if (!isFunction(redirect) && !isString(redirect)) {
      throw new TypeError(`Expected a redirect path or function. Got type: ${typeOf(redirect)}, value: ${redirect}`);
    }

    this.#prepareRoute({ pattern, redirect }).forEach((route) => {
      this.#routes.push({
        pattern: route.pattern,
        meta: route.meta,
        fragments: patternToFragments(route.pattern),
      });
    });

    return this;
  }

  /**
   * Runs `callback` after app-level stores are connected to the app, but before views are connected to the DOM.
   * Use this function to run async configuration code before displaying content to the user.
   *
   * Note that this will delay content being displayed on the screen, so using some kind of splash screen is recommended.
   */
  configure(callback: ConfigureCallback) {
    if (this.#configureCallback !== undefined) {
      this.#debugChannel.warn(`Configure callback is already defined. Only the final configure call will take effect.`);
    }

    this.#configureCallback = callback;
  }

  /**
   * Initializes and connects the app as a child of `element`.
   *
   * @param element - A selector string or a DOM node to attach to. If a string, follows the same format as that taken by `document.querySelector`.
   */
  async connect(selector: string | Node) {
    let element: HTMLElement | null = null;

    if (isString(selector)) {
      element = document.querySelector(selector);
      assertInstanceOf(HTMLElement, element, `Selector string '${selector}' did not match any element.`);
    }

    assertInstanceOf(HTMLElement, element, "Expected a DOM node or a selector string. Got type: %t, value: %v");

    const appContext = this.#appContext;
    const elementContext = this.#elementContext;
    const debugChannel = this.#debugChannel;

    appContext.rootElement = element!;

    // Sort routes by specificity for correct matching.
    this.#routes = sortRoutes(this.#routes);

    // Pass language options to language store.
    const language = this.#stores.get("language")!;
    this.#stores.set("language", {
      ...language,
      options: {
        languages: Object.fromEntries(this.#languages.entries()),
        currentLanguage: this.#currentLanguage,
      },
    });

    // Pass route options to router store.
    const router = this.#stores.get("router")!;
    this.#stores.set("router", {
      ...router,
      options: {
        options: this.#options.router,
        routes: this.#routes,
      },
    });

    debugChannel.info(`Total routes: ${this.#routes.length}`);

    // First, initialize the root view. The router store needs this to connect the initial route.
    appContext.rootView = initView({
      view: this.#mainView.type as View<any>,
      props: this.#mainView.props,
      appContext,
      elementContext,
    });

    // Initialize stores.
    for (let [key, item] of this.#stores.entries()) {
      const { store, options } = item;

      // Channel prefix is displayed before the global's name in console messages that go through a debug channel.
      // Built-in globals get an additional 'borf/' prefix so it's clear messages are from the framework.
      // 'borf/*' messages are filtered out by default, but this can be overridden with the app's `debug.filter` option.
      const channelPrefix = isString(key) ? "borf/store" : "store";
      const label = isString(key) ? key : store.name ?? "(anonymous)";
      const config = {
        store,
        appContext,
        elementContext,
        channelPrefix,
        label,
        options: options ?? {},
      };

      const instance = initStore(config);

      await instance.setup();

      // Add instance and mark as ready.
      this.#stores.set(key, { ...item, instance });
    }

    for (const { instance } of this.#stores.values()) {
      await instance!.connect();
    }

    if (this.#configureCallback) {
      await this.#configureCallback({
        // TODO: Add context methods
      });
    }

    // Then connect the root view.
    await appContext.rootView!.connect(appContext.rootElement);

    // The app is now connected.
    this.#isConnected = true;
  }

  /**
   * Disconnects views and tears down globals, removing the app from the page.
   */
  async disconnect() {
    if (this.#isConnected) {
      const appContext = this.#appContext;

      // Remove the root view from the page (runs teardown callbacks on all connected views).
      await appContext.rootView!.disconnect();

      // The app is considered disconnected at this point
      this.#isConnected = false;

      // Stop all observers
      for (const stop of this.#stopCallbacks) {
        stop();
      }
      this.#stopCallbacks = [];

      // Disconnect stores
      for (const { instance } of this.#stores.values()) {
        await instance!.disconnect();
      }
    }
  }

  /**
   * Parses a route definition object into a set of matchable routes.
   *
   * @param route - Route config object.
   * @param layers - Array of parent layers. Passed when this function calls itself on nested routes.
   */
  #prepareRoute(
    route: {
      pattern: string;
      redirect?: string | ((ctx: RedirectContext) => void);
      view?: View<unknown> | null;
      subroutes?: (router: AppRouter) => void;
    },
    layers = []
  ) {
    if (!isObject(route) || !isString(route.pattern)) {
      throw new TypeError(`Route configs must be objects with a 'pattern' string property. Got: ${route}`);
    }

    const parts = splitPath(route.pattern);

    // Remove trailing wildcard for joining with nested routes.
    if (parts[parts.length - 1] === "*") {
      parts.pop();
    }

    const routes: RouteConfig[] = [];

    if (route.redirect) {
      let redirect = route.redirect;

      if (isString(redirect)) {
        redirect = resolvePath(joinPath(parts), redirect);

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

    let view: View<{}> | undefined;

    if (!route.view) {
      view = DefaultRootView;
    } else if (typeof route.view === "function") {
      view = route.view;
    } else {
      throw new TypeError(`Route '${route.pattern}' expected a view function. Got: ${route.view}`);
    }

    const markup = m(view);
    const layer: RouteLayer = { id: this.#layerId++, markup };

    // Parse nested routes if they exist.
    if (route.subroutes) {
      const router: AppRouter = {
        route: (pattern: string, view: View<any> | null, subroutes: (router: AppRouter) => void) => {
          pattern = joinPath([...parts, pattern]);
          routes.push(...this.#prepareRoute({ pattern, view, subroutes }));
          return router;
        },
        redirect: (pattern, redirect) => {
          pattern = joinPath([...parts, pattern]);
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

type CrashPageProps = {
  message: string;
  error: Error;
  componentName: string;
};

function DefaultCrashPage({ message, error, componentName }: CrashPageProps) {
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
    m("h1", { style: { marginBottom: "0.5rem" } }, "The app has crashed"),
    m(
      "p",
      { style: { marginBottom: "0.25rem" } },
      m("span", { style: { fontFamily: "monospace" } }, componentName),
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
    m("p", {}, "Please see the browser console for details.")
  );
}
