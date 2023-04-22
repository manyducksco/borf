// import { Type, Timer } from "@borf/bedrock";
// import { Connectable } from "./Connectable.js";
// import { Markup, formatChildren, type Renderable } from "./Markup.js";
// import { Outlet } from "./Outlet.js";
// import { Repeat } from "./Repeat.js";
// import { Readable } from "./Writable.js";

// import { type Ref } from "./Ref.js";
// import { Component, type ComponentConfig, type ComponentContext, type Constructor } from "./Component.js";
// import { type DebugChannel } from "./DebugHub.js";
// import { APP_CONTEXT, CHILDREN, ELEMENT_CONTEXT, INPUTS } from "../keys.js";

// // ----- Types ----- //

// /**
//  * Context object passed as the third argument to View.forEach render function.
//  * Has methods that act as analogues to those found on a component's `this` object.
//  */
// export interface ViewContext extends ComponentContext {
//   animateIn(callback: () => Promise<any>): void;
//   animateOut(callback: () => Promise<any>): void;
// }

// /*================================*\
// ||           View Object          ||
// \*================================*/

// /**
//  * A visual component that expresses part of your app's state in DOM nodes.
//  */
// export class View<I = any> extends Component<I> implements ViewContext {
//   /*===========================*\
//   ||       Static Methods      ||
//   \*===========================*/

//   static isView<I>(value: any): value is Constructor<View<I>> {
//     return value?.prototype instanceof View;
//   }

//   /**
//    * Takes a Readable `value` and displays `then` content when `value` is truthy, or `otherwise` content when `value` is falsy.
//    */
//   static when(value: Readable<any>, then?: Renderable, otherwise?: Renderable) {
//     return new Markup((config) => {
//       return new Outlet({
//         ...config,
//         readable: value,
//         render: (value) => {
//           if (value) {
//             return then;
//           }

//           if (otherwise) {
//             return otherwise;
//           }

//           return null;
//         },
//       });
//     });
//   }

//   /**
//    * Takes a Readable `value` and displays `then` content when `value` is falsy.
//    */
//   static unless(value: Readable<any>, then: Renderable) {
//     return new Markup((config) => {
//       return new Outlet({
//         ...config,
//         readable: value,
//         render: (value) => {
//           if (!value) {
//             return then;
//           }

//           return null;
//         },
//       });
//     });
//   }

//   static observe<T>(readable: Readable<T>, render: (value: T) => Renderable) {
//     return new Markup((config) => {
//       return new Outlet({
//         ...config,
//         readable: readable,
//         render,
//       });
//     });
//   }

//   /**
//    * Displays an instance of `view` for each item in `values`. Dynamically adds and removes views as items change.
//    * For complex objects with an ID, define a `key` function to select that ID.
//    * Object identity (`===`) will be used for comparison if no `key` function is passed.
//    *
//    * TODO: Describe or link to docs where keying is explained.
//    */
//   static forEach<T>(
//     readable: Readable<Iterable<T>>,
//     render: ($value: Readable<T>, $index: Readable<number>, ctx: ViewContext) => Renderable,
//     key: (value: T, index: number) => string | number
//   ) {
//     return new Markup((config) => {
//       return new Repeat<T>({
//         ...config,
//         readable,
//         render,
//         key,
//       });
//     });
//   }

//   /* ----- Instance Stuff ----- */

//   #animateInCallbacks: (() => Promise<any>)[] = [];
//   #animateOutCallbacks: (() => Promise<any>)[] = [];
//   #connectable?: Connectable;

//   constructor(config: ComponentConfig<I>) {
//     super({
//       ...config,
//       channelPrefix: config.channelPrefix ?? "view",
//     });
//   }

//   /*=================================*\
//   ||   Context Methods for Authors   ||
//   \*=================================*/

//   /**
//    * Takes a callback that performs an animation.
//    * Can be called repeatedly. Each callback will be awaited in sequence before connect.
//    */
//   animateIn(callback: () => Promise<any>) {
//     this.#animateInCallbacks.push(callback);
//   }

//   /**
//    * Takes a callback that performs an animation.
//    * Can be called repeatedly. Each callback will be awaited in sequence before disconnect.
//    */
//   animateOut(callback: () => Promise<void>) {
//     this.#animateOutCallbacks.push(callback);
//   }

//   /**
//    * Displays children or subroutes of this view.
//    */
//   outlet(): Markup {
//     return new Markup((config) => new Outlet({ ...config, readable: this[CHILDREN] }));
//   }

//   /*=================================*\
//   ||        Framework Methods        ||
//   \*=================================*/

//   /**
//    * Connects this view to the DOM, running lifecycle hooks if it wasn't already connected.
//    * Calling this on a view that is already connected can reorder it or move it to a different
//    * place in the DOM without re-triggering lifecycle hooks.
//    *
//    * @param parent - DOM node under which this view should be connected as a child.
//    * @param after - A child node under `parent` after which this view should be connected.
//    */
//   async __connect(parent: Node, after?: Node) {
//     const timer = new Timer();

//     return new Promise<void>(async (resolve, reject) => {
//       const wasConnected = this.isConnected;

//       if (!wasConnected) {
//         await this.#initialize(parent, after); // Run setup() to configure the view.
//         this[INPUTS].connect();
//       }

//       if (this.#connectable) {
//         // TODO: Handle errors
//         this.#connectable.__connect(parent, after);
//       }

//       if (!wasConnected) {
//         for (const callback of this.#animateInCallbacks) {
//           try {
//             await callback();
//           } catch (error) {
//             if (error instanceof Error) {
//               this[APP_CONTEXT].crashCollector.crash({ error, component: this });
//             } else {
//               throw error;
//             }
//           }
//         }

//         // TODO: Why are we wrapping these in setTimeout?
//         setTimeout(() => {
//           super.__connect(parent, after).catch((error) => {
//             this[APP_CONTEXT].crashCollector.crash({ error, component: this });
//           });
//           // this.#logger.log(`connected in ${timer.formatted}`);
//           resolve();
//         }, 0);
//       }
//     });
//   }

//   /**
//    * Disconnects this view from the DOM and runs lifecycle hooks.
//    */
//   async __disconnect() {
//     if (!this.isConnected) {
//       return Promise.resolve();
//     }

//     return new Promise<void>(async (resolve) => {
//       for (const callback of this.#animateOutCallbacks) {
//         try {
//           await callback();
//         } catch (error) {
//           if (error instanceof Error) {
//             this[APP_CONTEXT].crashCollector.crash({ error, component: this });
//           } else {
//             throw error;
//           }
//         }
//       }

//       if (this.#connectable) {
//         // TODO: Handle errors
//         this.#connectable.__disconnect();
//       }

//       // TODO: Why are we wrapping these in setTimeout?
//       setTimeout(() => {
//         super
//           .__disconnect()
//           .catch((error) => {
//             this[APP_CONTEXT].crashCollector.crash({ error, component: this });
//           })
//           .then(() => {
//             resolve();
//           });
//       }, 0);

//       this[INPUTS].disconnect();
//     });
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

//     let element: Renderable;

//     try {
//       element = this.setup() as Renderable;
//     } catch (error) {
//       if (error instanceof Error) {
//         appContext.crashCollector.crash({ error, component: this });
//       } else {
//         throw error;
//       }
//     }

//     // Display loading content while setup promise pends.
//     if (Type.isPromise<Renderable>(element)) {
//       let cleanup;

//       if (Type.isFunction(this.loading)) {
//         // Render contents from loading() while waiting for setup to resolve.
//         const content = formatChildren(this.loading())[0];
//         assertMarkup(content);

//         const component = content.init({ appContext, elementContext });
//         component.__connect(parent, after);

//         cleanup = () => component.__disconnect();
//       }

//       try {
//         element = await element;
//       } catch (error) {
//         if (error instanceof Error) {
//           appContext.crashCollector.crash({ error, component: this });
//         } else {
//           throw error;
//         }
//       }

//       if (cleanup) {
//         cleanup();
//       }
//     }

//     if (assertMarkup(element)) {
//       this.#connectable = element.init({ appContext, elementContext });

//       // TODO: Implement refs
//       // if (this.ref) {
//       //   // TODO: Rework Ref types if a basic Node can be stored in one. This may not always be an HTMLElement.
//       //   this.ref.element = this.#connectable.__node as HTMLElement;
//       // }
//     }
//   }
// }

// const assertMarkup = (element: unknown): element is Markup => {
//   if (element === undefined) {
//     throw new TypeError(`Views must return a markup element, or null to render nothing. Returned undefined.`);
//   }

//   if (element !== null) {
//     // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
//     // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
//     if (!Markup.isMarkup(element)) {
//       throw new TypeError(`Views must return a markup element, or null to render nothing. Returned ${element}.`);
//     }
//   }

//   return true;
// };
