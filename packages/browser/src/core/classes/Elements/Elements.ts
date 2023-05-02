import { DebugHub } from "../DebugHub.js";
import { type AppContext, type ElementContext, type StoreRegistration } from "../App.js";
import { type BuiltInStores } from "../../types.js";
import { CrashCollector } from "../CrashCollector.js";
import { makeComponent, type Component, type Store, type ComponentControls } from "../../component.js";
import { Markup, formatChildren, isRenderable, type Renderable } from "../Markup.js";

import { HTTPStore } from "../../stores/http.js";
import { DocumentStore } from "../../stores/document.js";
import { RouterStore } from "./stores/router.js";

// TODO: Local store elements currently do not apply themselves to the elementContext

type ElementRegistration = {
  tag: string;
  component: Component<any>;
};

/**
 * A collection of stores and views that can be invoked as custom HTML elements.
 * Makes views usable as drop-in elements in a regular website without dedicating yourself to an entire App.
 */
export class Elements {
  #stores = new Map<keyof BuiltInStores | Store<any, any>, StoreRegistration>([
    ["http", { store: HTTPStore }],
    ["document", { store: DocumentStore }],
    ["router", { store: RouterStore }],
  ]);

  #elements: ElementRegistration[] = [];
  #isConnected = false;

  #appContext: AppContext;
  #elementContext: ElementContext = {
    stores: new Map<Store<any, any>, StoreRegistration>(),
  };

  constructor() {
    const crashCollector = new CrashCollector();
    const debugHub = new DebugHub({ crashCollector, mode: "production" });

    // Log error to console on component's channel.
    crashCollector.onError(({ error, componentName }) => {
      debugHub.channel({ name: componentName }).error(error);
    });

    this.#appContext = {
      mode: "production",
      crashCollector,
      debugHub,
      stores: new Map(),
    };
  }

  /**
   * Registers a new store for all elements on this hub.
   */
  addStore<I>(store: Store<I, any>, inputs?: I) {
    if (this.#isConnected) {
      throw new Error(`Stores can be added only before Elements is connected.`);
    }

    this.#stores.set(store, { store, inputs });
  }

  /**
   * Registers a new HTML custom element implemented as a view or store.
   */
  addElement(tag: string, component: Component<any>) {
    if (!tag.includes("-")) {
      throw new Error(`Custom element names are required to have a dash ('-') character in them. Got: ${tag}`);
    }

    this.#elements.push({ tag, component });
  }

  /**
   * Registers stores and elements so they will take effect on the page.
   */
  async connect() {
    if (this.#isConnected) {
      return;
    }

    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    const rootElement = document.createElement("div"); // Connect stores to dummy div that never gets mounted.

    for (const [store, config] of this.#stores.entries()) {
      const instance = makeComponent({
        component: config.store,
        appContext,
        elementContext,
        inputs: config.inputs ?? {},
      });
      appContext.stores.set(store, { ...config, instance });

      await instance.connect(rootElement);
    }

    if (!window.customElements) {
      throw new Error(`This browser does not support custom elements.`);
    }

    for (const element of this.#elements) {
      customElements.define(
        element.tag,
        class extends BorfCustomElement {
          component = element.component;
          appContext = appContext;
          elementContext = { ...elementContext };

          // static get observedAttributes() {
          //   if (element.component.inputs) {
          //     return Object.keys(element.component.inputs); // Subscribe to changes on all defined inputs.
          //   } else {
          //     return [];
          //   }
          // }
        }
      );
    }

    this.#isConnected = true;
  }
}

class BorfCustomElement extends HTMLElement {
  appContext!: AppContext;
  elementContext!: ElementContext;
  component!: Component<any>;
  instance!: ComponentControls;

  connectedCallback() {
    // Unpack the NamedNodeMap into a plain object with camelCase names.
    const initialValues = Object.values(this.attributes).reduce((obj, attr) => {
      obj[toCamelCase(attr.localName)] = attr.value;
      return obj;
    }, {} as Record<string, string>);

    // Convert children to Markup
    const children: Markup[] = [];

    for (const child of this.children) {
      child.remove();

      if (child instanceof HTMLElement) {
        const markup = new Markup((config) => {
          // Supply contexts to component
          if (child instanceof BorfCustomElement) {
            child.appContext = config.appContext;
            child.elementContext = config.elementContext;
          }

          // Wrap it in a connectable
          return {
            node: child,
            get isConnected() {
              return child.parentNode != null;
            },
            async connect(parent: Node, after?: Node) {
              parent.insertBefore(child, after ?? null);
            },
            async disconnect() {
              child.remove();
            },
          };
        });

        children.push(markup);
      } else if (isRenderable(child)) {
        children.push(...formatChildren([child]));
      }
    }

    this.instance = makeComponent({
      component: this.component,
      appContext: this.appContext,
      elementContext: this.elementContext,
      inputs: initialValues, // TODO: Update attributes when `attributeChangedCallback` runs.
      children,
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

function toCamelCase(name: string) {
  return name.replace(/-./g, (x) => x[1].toUpperCase());
}
