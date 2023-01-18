import { isFunction, isObject, isString } from "./helpers/typeChecking.js";
import { parseRoute, splitRoute } from "./helpers/routing.js";
import { joinPath } from "./helpers/joinPath.js";
import { resolvePath } from "./helpers/resolvePath.js";
import { makeDebug } from "./helpers/makeDebug.js";
import { makeGlobal } from "./makeGlobal.js";
import { ViewBlueprint } from "./blueprints/View.js";

import dialog from "./globals/dialog.js";
import http from "./globals/http.js";
import page from "./globals/page.js";
import router from "./globals/router.js";

const builtInGlobals = [dialog, router, page, http];

export function makeApp(options) {
  return new App(options);
}

class App {
  _layerId = 0;
  _subscriptions = [];

  options = {
    preload: null,
    view: (ctx) => ctx.outlet(),
    globals: {},
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

  globals = [
    { name: "@dialog", global: dialog },
    { name: "@router", global: router },
    { name: "@page", global: page },
    { name: "@http", global: http },
  ];

  routes = [];

  isConnected = false;

  constructor(options) {
    if (!options) {
      options = {};
    }

    // Support calling with only a view setup function.
    if (isFunction(options)) {
      options = {
        view: options,
      };
    }

    // Merge options.
    options = Object.assign(this.options, options);

    // Add developer-defined globals.
    if (options.globals) {
      for (const { name, global } of options.globals) {
        const dupeIndex = this.globals.findIndex((x) => x.name === name);
        if (dupeIndex > -1) {
          this.globals.splice(dupeIndex, 1);
        }
        this.globals.push({ name, global });
      }
    }

    if (options.routes) {
      this.routes = [];

      for (const route of options.routes) {
        this.routes.push(...this.#prepareRoute(route));
      }
    }

    this._context = {
      options,
      debug: makeDebug(options.debug ?? {}),
      globals: {},
      routes: this.routes,
      rootElement: null,
      rootView: null,
      // $dialogs - added by dialog global
    };
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

    if (!(element instanceof Node)) {
      throw new TypeError(`Expected a DOM node. Got: ${element}`);
    }

    const appContext = this._context;

    appContext.rootElement = element;

    // Set up crashing getters to handle globals being accessed by other globals.
    for (const { name } of this.globals) {
      Object.defineProperty(appContext.globals, name, {
        get() {
          throw new Error(
            `Global '${name}' was accessed before it was initialized. Make sure '${name}' is registered before other globals that access it.`
          );
        },
        configurable: true,
      });
    }

    // Initialize globals.
    for (let { name, global } of this.globals) {
      if (isFunction(global)) {
        global = makeGlobal(global);
      }

      if (global == null || !global.isGlobal) {
        throw new TypeError(`Global '${name}' must be a global or a global setup function. Got: ${global}`);
      }

      let channelPrefix = "global";
      if (builtInGlobals.includes(global)) {
        channelPrefix = "woofe:global";
      }

      const instance = global.instantiate({ appContext, channelPrefix, name: global.name || name });

      if (!isObject(instance.exports)) {
        throw new TypeError(`Setup function for global '${name}' did not return an object.`);
      }

      // Add to appContext.globals
      Object.defineProperty(appContext.globals, name, {
        value: instance,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    }

    // beforeConnect is the first opportunity to configure globals before anything else happens.
    for (const global of Object.values(appContext.globals)) {
      await global.beforeConnect();
    }

    return this.#preload().then(async (attributes) => {
      // Initialize view and connect to root element.
      appContext.rootView = new ViewBlueprint(this.options.view).build({ appContext, attributes });
      appContext.rootView.connect(appContext.rootElement);

      // Send connected signal to all globals.
      for (const global of Object.values(appContext.globals)) {
        global.afterConnect();
      }

      this._subscriptions.push(connectDialogs(appContext));

      this.isConnected = true;
    });
  }

  async disconnect() {
    if (this.isConnected) {
      const appContext = this._context;

      for (const global of Object.values(appContext.globals)) {
        await global.beforeDisconnect();
      }

      await appContext.rootView.disconnect();

      this.isConnected = false;

      while (this._subscriptions.length > 0) {
        const sub = this._subscriptions.shift();
        sub.unsubscribe();
      }

      for (const global of Object.values(appContext.globals)) {
        await global.afterDisconnect();
      }
    }
  }

  async #preload() {
    if (this.options.preload) {
      const appContext = this._context;
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
              appContext.redirectPath = to;
              resolve();
              resolved = true;
            }
          },
        };

        const result = this.options.preload(ctx);

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

    return {};
  }

  /**
   * Parses routes into a flat data structure appropriate for handling by the router.
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

    const layer = { id: this._layerId++, view: route.view || ((ctx) => ctx.outlet()) };

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
 * Creates a dialog outlet element that gets added to the DOM to contain dialogs
 * when there is at least one in the list.
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
