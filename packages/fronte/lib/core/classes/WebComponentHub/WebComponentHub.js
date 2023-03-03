import { Type } from "@frameworke/bedrocke";

import { DebugHub } from "../DebugHub.js";
import { Store } from "../Store.js";
import { HTTPStore } from "../../stores/http.js";
import { PageStore } from "../../stores/page.js";

import { DialogStore } from "./stores/dialog.js";
import { RouterStore } from "./stores/router.js";

export class WebComponentHub {
  #stores = [
    { store: "http", exports: HTTPStore },
    { store: "page", exports: PageStore },
    { store: "dialog", exports: DialogStore },
    { store: "router", exports: RouterStore },
  ];
  #elements = [];
  #isConnected = false;

  #appContext = {
    debugHub: new DebugHub(),
    stores: new Map(),
    rootElement: {
      insertBefore: () => {},
      removeChild: () => {},
    },
  };
  #elementContext = {
    stores: new Map(),
  };

  /**
   * Registers a new store for all elements on this hub.
   */
  addStore(store) {
    if (Type.isClass(store)) {
      this.#stores.push({ store, instance: undefined });
    } else if (Type.isObject(store)) {
      this.#stores.push({ ...store, instance: undefined });
    } else {
      throw new TypeError(`Expected a store class or a store config object. Got: ${store}`);
    }

    if (this.#isConnected) {
      // TODO: Set the store up if it isn't already.
      let config;

      if (Store.isStore(store)) {
        config = { store, instance: undefined };
      } else if (Type.isObject(store)) {
        config = { ...store, instance: undefined };
      } else {
        throw new Error(`Expected a Store or a config object. Got: ${store}`);
      }

      let C;

      if (Type.isString(config.store)) {
        if (config.exports == null) {
          throw new Error("An 'exports' store must be defined when overriding a built in store.");
        }

        if (!Store.isStore(config.exports)) {
          throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
        }

        C = config.exports;
      } else if (Store.isStore(config.store)) {
        if (config.exports && !Store.isStore(config.exports)) {
          throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
        }

        C = config.exports || config.store;
      } else {
        throw new TypeError(
          `config.stores must contain only store classes or store config objects. Got: ${config.store}`
        );
      }

      const instance = new C({
        appContext: this.#appContext,
        elementContext: this.#elementContext,
        inputs: config.inputs,
        inputDefs: config.store.inputs,
      });

      this.#elementContext.stores.set(config.store, { ...config, instance });
    }
  }

  /**
   * Registers a new HTML custom element implemented as a view or store.
   */
  addElement(tag, component) {
    this.#elements.push({ tag, component, defined: false });
  }

  /**
   * Registers stores and elements so they will take effect on the page.
   */
  async register() {
    const { rootElement } = this.#appContext;
    const { stores } = this.#elementContext;

    for (const [_, config] of stores.entries()) {
      await config.instance.connect(rootElement);
    }

    for (const element of this.#elements) {
      if (!element.defined) {
        if (!element.tag.includes("-")) {
          throw new Error(
            `Custom element names are required to have a dash ('-') character in them. Got: ${element.tag}`
          );
        }

        if (!window.customElements) {
          throw new Error(`This browser does not support custom elements.`);
        }

        customElements.define(
          element.tag,
          class extends FronteWebComponent {
            component = element.component;

            static get observedAttributes() {
              if (element.component.inputs) {
                return Object.keys(element.component.inputs); // Subscribe to changes on all defined attributes.
              } else {
                return [];
              }
            }
          }
        );

        // Store status to avoid redefining on disconnect -> connect
        element.defined = true;
      }
    }
  }
}

class FronteWebComponent extends HTMLElement {
  component;
  instance;

  connectedCallback() {
    // Unpack the NamedNodeMap into a plain object.
    const initialValues = Object.values(this.attributes).reduce((obj, attr) => {
      obj[attr.localName] = attr.value;
      return obj;
    }, {});

    this.instance = new this.component({
      appContext,
      elementContext,
      inputs: initialValues, // TODO: Update attributes when `attributeChangedCallback` runs.
      inputDefs: this.component.inputs,
      channelPrefix: "element",
      label: this.component.label || this.localName,
    });

    const shadow = this.attachShadow({ mode: "open" });

    this.instance.connect(shadow);
  }

  disconnectedCallback() {
    this.instance.disconnect();
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   console.log(`Attribute '${name}' changed from ${oldValue} to ${newValue}`);
  // }
}
