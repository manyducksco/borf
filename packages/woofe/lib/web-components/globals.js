import { DebugHub } from "../core/classes/DebugHub.js";
import { HTTPStore } from "../core/stores/http.js";
import { PageStore } from "../core/stores/page.js";
import { isObject, isStore, isString } from "../core/helpers/typeChecking.js";

import { DialogStore } from "./stores/dialog.js";
import { RouterStore } from "./stores/router.js";

/**
 * This module is where global state is stored for woofe web components.
 */

export const appContext = {
  debug: new DebugHub(),
  stores: new Map(),
  rootElement: {
    insertBefore: () => {},
    removeChild: () => {},
  },
};

export const elementContext = {
  stores: new Map(),
};

const channel = appContext.debug.channel("woofe:web-components");

/**
 * Adds a new global store.
 */
export function defineStore(store) {
  let config;

  if (isStore(store)) {
    config = { store, instance: undefined };
  } else if (isObject(store)) {
    config = { ...store, instance: undefined };
  } else {
    throw new Error(`Expected a Store or a config object. Got: ${store}`);
  }

  let StoreClass;

  if (isString(config.store)) {
    if (config.exports == null) {
      throw new Error("An 'exports' store must be defined when overriding a built in store.");
    }

    if (!isStore(config.exports)) {
      throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
    }

    StoreClass = config.exports;
  } else if (isStore(config.store)) {
    if (config.exports && !isStore(config.exports)) {
      throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
    }

    StoreClass = config.exports || config.store;
  } else {
    throw new TypeError(`config.stores must contain only store classes or store config objects. Got: ${config.store}`);
  }

  const instance = new StoreClass({
    appContext,
    elementContext,
    attributes: config.attrs,
    attributeDefs: config.store.attrs,
  });

  instance.connect(appContext.rootElement);

  appContext.stores.set(config.store, { ...config, instance });
}

/**
 * Returns an instance of a global store.
 */
export function useStore(store) {
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
        `Store '${name}' was accessed before it was set up. Make sure '${name}' is defined before other stores that access it.`
      );
    }

    return _store.instance.exports;
  }

  throw new Error(`Store '${name}' is not defined on this page.`);
}

// Define built-ins.
defineStore({ store: "http", exports: HTTPStore });
defineStore({ store: "page", exports: PageStore });
defineStore({ store: "dialog", exports: DialogStore });
defineStore({ store: "router", exports: RouterStore });
