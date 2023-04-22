// import { Type } from "@borf/bedrock";
// import { Markup, formatChildren } from "./Markup.js";
// import { Outlet } from "./Outlet.js";
// import { Component, type ComponentContext, type ComponentConfig, type Constructor } from "./Component.js";
// import { type StoreRegistration } from "./App.js";
// import { APP_CONTEXT, CHILDREN, ELEMENT_CONTEXT, INPUTS } from "../keys.js";

// // ----- Types ----- //

// interface StoreConfig<I> extends ComponentConfig<I> {}

// export type StoreConstructor<I> = { new (config: StoreConfig<I>): Store<I> };

// /**
//  * A data component that generates a shared object accessible to other components.
//  */
// export class Store<I = any> extends Component<I> implements ComponentContext {
//   static isStore<I = unknown>(value: any): value is Constructor<Store<I>> {
//     return value?.prototype instanceof Store;
//   }

//   #outlet: Outlet<any>;
//   __outputs?: object;

//   override get __node() {
//     return this.#outlet.__node;
//   }

//   constructor(config: StoreConfig<I>) {
//     super({
//       ...config,
//       channelPrefix: config.channelPrefix ?? "store",
//     });

//     config.elementContext.stores = new Map([
//       ...config.elementContext.stores.entries(),
//       [this, { store: this, instance: this } as StoreRegistration<any>],
//     ]);

//     this.#outlet = new Outlet({
//       readable: this[CHILDREN],
//       appContext: this[APP_CONTEXT],
//       elementContext: this[ELEMENT_CONTEXT],
//     });
//   }

//   /**
//    * Connects this view to the DOM, running lifecycle hooks if it wasn't already connected.
//    * Calling this on a view that is already connected can reorder it or move it to a different
//    * place in the DOM without re-triggering lifecycle hooks.
//    *
//    * @param parent - DOM node under which this view should be connected as a child.
//    * @param after - A child node under `parent` after which this view should be connected.
//    */
//   override async __connect(parent: Node, after?: Node) {
//     const wasConnected = this.isConnected;

//     if (!wasConnected) {
//       await this.#initialize(parent, after); // Run setup() to configure the view.
//       this[INPUTS].connect();
//     }

//     // TODO: Handle errors
//     this.#outlet.__connect(parent, after);

//     if (!wasConnected) {
//       // TODO: Handle errors
//       super.__connect(parent, after);
//     }
//   }

//   /**
//    * Disconnects this view from the DOM and runs lifecycle hooks.
//    */
//   override async __disconnect() {
//     if (!this.isConnected) {
//       return Promise.resolve();
//     }

//     // TODO: Handle errors
//     this.#outlet.__disconnect();
//     super.__disconnect();
//     this[INPUTS].disconnect();
//   }

//   /**
//    * Prepares this view to be connected, handling loading state if necessary.
//    *
//    * @param parent - DOM node to connect loading content to.
//    * @param after - Sibling DOM node directly after which this view's node should appear.
//    */
//   async #initialize(parent: Node, after?: Node) {
//     const appContext = this[APP_CONTEXT];
//     const elementContext = this[ELEMENT_CONTEXT];

//     let outputs: unknown;

//     try {
//       outputs = this.setup();
//     } catch (error) {
//       if (error instanceof Error) {
//         appContext.crashCollector.crash({ error, componentName: this });
//       } else {
//         throw error;
//       }
//     }

//     // Display loading content while setup promise pends.
//     if (Type.isPromise(outputs)) {
//       let cleanup;

//       if (Type.isFunction(this.loading)) {
//         // Render contents from loading() while waiting for setup to resolve.
//         const content = formatChildren(this.loading())[0];

//         if (content === undefined) {
//           throw new TypeError(`loading() must return a markup element, or null to render nothing. Returned undefined.`);
//         }

//         if (content !== null) {
//           // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
//           // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
//           if (!Markup.isMarkup(content)) {
//             throw new TypeError(
//               `loading() must return a markup element, or null to render nothing. Returned ${content}.`
//             );
//           }
//         }

//         const component = content.init({ appContext, elementContext });
//         component.__connect(parent, after);

//         cleanup = () => component.__disconnect();
//       }

//       try {
//         outputs = await outputs;
//       } catch (error) {
//         if (error instanceof Error) {
//           appContext.crashCollector.crash({ error, componentName: this });
//         } else {
//           throw error;
//         }
//       }

//       if (cleanup) {
//         cleanup();
//       }
//     }

//     if (!(outputs != null && typeof outputs === "object" && !Array.isArray(outputs))) {
//       throw new TypeError(`A store setup function must return an object. Got: ${outputs}`);
//     }

//     this.__outputs = outputs;
//   }
// }
