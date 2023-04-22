// import { Type } from "@borf/bedrock";

// import { DebugHub } from "../DebugHub.js";
// import { type Connectable } from "../Connectable.js";
// import { type AppContext, type ElementContext } from "../App.js";
// import { type BuiltInStores } from "../../types.js";
// import { CrashCollector } from "../CrashCollector.js";
// import { makeComponent, type Component, type ComponentControls, type Store, type View } from "../../scratch.js";

// import { HTTPStore } from "../../stores/http.js";
// import { PageStore } from "../../stores/page.js";
// import { RouterStore } from "./stores/router.js";

// type StoreRegistration<I = any> = {
//   store: keyof BuiltInStores | Store<any, any>;
//   exports?: Store<I, any>;
//   instance?: ComponentControls;
//   inputs?: I;
// };

// type ElementRegistration = {
//   tag: string;
//   component: Component<any>;
//   defined: boolean;
// };

// export class ElementHub {
//   #stores: StoreRegistration[] = [
//     { store: "http", exports: HTTPStore },
//     { store: "page", exports: PageStore },
//     // { store: "dialog", exports: DialogStore },
//     { store: "router", exports: RouterStore },
//   ];
//   #elements: ElementRegistration[] = [];
//   #isConnected = false;

//   #appContext: AppContext;
//   #elementContext = {
//     stores: new Map(),
//   };

//   constructor() {
//     const crashCollector = new CrashCollector();
//     const debugHub = new DebugHub({ crashCollector, mode: "production" });

//     // Log error to console on component's channel.
//     crashCollector.onError(({ error, componentName }) => {
//       debugHub.channel(componentName).error(error);
//     });

//     this.#appContext = {
//       mode: "production",
//       crashCollector,
//       debugHub,
//       stores: new Map(),
//     };
//   }

//   /**
//    * Registers a new store for all elements on this hub.
//    */
//   addStore(store: Store<any, any> | StoreRegistration) {
//     if (Type.isClass(store)) {
//       this.#stores.push({ store: store as Store<any, any>, instance: undefined });
//     } else if (Type.isObject(store)) {
//       this.#stores.push({ ...(store as StoreRegistration), instance: undefined });
//     } else {
//       throw new TypeError(`Expected a store class or a store config object. Got: ${store}`);
//     }

//     if (this.#isConnected) {
//       // TODO: Set the store up if it isn't already.
//       let config: StoreRegistration;

//       if (Store.isStore(store)) {
//         config = { store: store as Store<any, any>, instance: undefined };
//       } else if (Type.isObject(store)) {
//         config = { ...(store as StoreRegistration), instance: undefined };
//       } else {
//         throw new Error(`Expected a Store or a config object. Got: ${store}`);
//       }

//       let exportedStore: Store<any, any>;

//       if (Type.isString(config.store)) {
//         if (config.exports == null) {
//           throw new Error("An 'exports' store must be defined when overriding a built in store.");
//         }

//         if (!Store.isStore(config.exports)) {
//           throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
//         }

//         exportedStore = config.exports;
//       } else if (Store.isStore(config.store)) {
//         if (config.exports && !Store.isStore(config.exports)) {
//           throw new TypeError(`Store config 'exports' must be a store class. Got: ${config.exports}`);
//         }

//         exportedStore = config.exports || config.store;
//       } else {
//         throw new TypeError(
//           `config.stores must contain only store classes or store config objects. Got: ${config.store}`
//         );
//       }

//       console.log({ appContext: this.#appContext });

//       const instance = exportedStore.create({
//         appContext: this.#appContext,
//         elementContext: this.#elementContext,
//         inputs: config.inputs,
//         // inputDefs: typeof config.store !== "string" ? config.store.inputs : undefined,
//       });

//       this.#elementContext.stores.set(config.store, { ...config, instance });
//     }
//   }

//   /**
//    * Registers a new HTML custom element implemented as a view or store.
//    */
//   addElement(tag: string, component: Component<any>) {
//     if (!tag.includes("-")) {
//       throw new Error(`Custom element names are required to have a dash ('-') character in them. Got: ${tag}`);
//     }

//     this.#elements.push({ tag, component, defined: false });
//   }

//   /**
//    * Registers stores and elements so they will take effect on the page.
//    */
//   async connect() {
//     const appContext = this.#appContext;
//     const elementContext = this.#elementContext;
//     const { stores } = elementContext;

//     const rootElement = document.createElement("div"); // Connect stores to dummy div that never gets mounted.

//     for (const [_, config] of stores.entries()) {
//       await config.instance.connect(rootElement);
//     }

//     for (const element of this.#elements) {
//       if (!element.defined) {
//         if (!element.tag.includes("-")) {
//           throw new Error(
//             `Custom element names are required to have a dash ('-') character in them. Got: ${element.tag}`
//           );
//         }

//         if (!window.customElements) {
//           throw new Error(`This browser does not support custom elements.`);
//         }

//         customElements.define(
//           element.tag,
//           class extends BorfCustomElement {
//             component = element.component;
//             appContext = appContext;
//             elementContext = elementContext;

//             // static get observedAttributes() {
//             //   if (element.component.inputs) {
//             //     return Object.keys(element.component.inputs); // Subscribe to changes on all defined inputs.
//             //   } else {
//             //     return [];
//             //   }
//             // }
//           }
//         );

//         // Store status to avoid redefining on disconnect -> connect
//         element.defined = true;
//       }
//     }
//   }
// }

// class BorfCustomElement extends HTMLElement {
//   appContext!: AppContext;
//   elementContext!: ElementContext;
//   component!: Component<any>;
//   instance!: Connectable;

//   connectedCallback() {
//     // Unpack the NamedNodeMap into a plain object.
//     const initialValues = Object.values(this.attributes).reduce((obj, attr) => {
//       obj[attr.localName] = attr.value;
//       return obj;
//     }, {} as Record<string, string>);

//     this.instance = makeComponent({
//       component: this.component,
//       appContext: this.appContext,
//       elementContext: this.elementContext,
//       inputs: initialValues, // TODO: Update attributes when `attributeChangedCallback` runs.
//     });

//     const shadow = this.attachShadow({ mode: "open" });

//     this.instance.connect(shadow);
//   }

//   disconnectedCallback() {
//     this.instance.disconnect();
//   }

//   // attributeChangedCallback(name, oldValue, newValue) {
//   //   console.log(`Attribute '${name}' changed from ${oldValue} to ${newValue}`);
//   // }
// }
