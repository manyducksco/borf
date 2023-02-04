import { Markup } from "../core/classes/Markup.js";
import { isView, isStore } from "../core/helpers/typeChecking.js";

export function makeViewer(component, config = {}) {
  return new Viewer(component, config);
}

class Viewer {
  isConnected = false;

  constructor(component, config = {}) {
    if (!isView(component) && !isStore(component)) {
      throw new TypeError(`Expected a component as the first argument. Got: ${component}`);
    }

    this.markup = new Markup((config) => new component(config));
    this.config = {
      stores: config.stores || [],
      attributes: config.attributes || {},
      presets: config.presets || [],
    };
  }

  async connect(parent, preset = null) {
    // Take values from top level config first.
    let stores = new Map(Object.entries(this.config.stores));
    let attributes = { ...this.config.attributes };

    // Merge in values from preset.
    if (preset) {
      const data = this.config.presets?.find((x) => x.name === preset);

      if (!data) {
        throw new Error(`Unknown viewer preset '${preset}'.`);
      }

      if (data.attributes) {
        Object.assign(attributes, data.attributes);
      }

      if (data.stores) {
        data.stores.forEach((store) => {
          let config;

          if (isStore(store)) {
            config = { store };
          } else if (isStore(store?.store)) {
            config = store;
            store = config.store;
          }

          stores.set(store, config);
        });
      }
    }

    // Disconnect old viewer content, if any.
    if (this.isConnected) {
      await this.disconnect();
    }

    const appContext = {
      stores: new Map(),
    };

    const elementContext = {
      stores: new Map(),
    };

    // Set up stores.
    for (const store of stores) {
      let config;

      if (isStore(store)) {
        config = { store };
      } else if (isStore(store?.store)) {
        config = store;
        store = config.store;
      }

      stores.set(store, config);
    }

    // Create and connect view.
    const view = this.markup.init({
      appContext,
      elementContext,
      attributes,
    });

    await view.connect(parent);

    this.current = {
      appContext,
      elementContext,
      view,
    };

    this.isConnected = true;
  }

  async disconnect() {
    if (this.isConnected) {
      const { appContext, elementContext, view } = this.current;

      for (const name in elementContext.locals) {
        await elementContext.locals[name].beforeDisconnect();
      }

      view.disconnect();

      for (const name in elementContext.locals) {
        await elementContext.locals[name].afterDisconnect();
      }

      for (const name in appContext.globals) {
        await appContext.globals[name].beforeDisconnect();
        await appContext.globals[name].afterDisconnect();
      }

      this.isConnected = false;
    }
  }
}
