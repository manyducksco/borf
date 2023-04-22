// import { type AppContext, type ElementContext } from "./App.js";
// import { Connectable } from "./Connectable.js";
// import { Inputs, InputsAPI, UnwrapReadables } from "./Inputs.js";
// import { type DebugChannel } from "./DebugHub.js";
// import { type Renderable, type Markup } from "./Markup.js";
// import { Writable, Readable, type ValuesOfReadables, type StopFunction } from "./Writable.js";
// import { Store, type StoreConstructor } from "./Store.js";
// import { type BuiltInStores } from "../types.js";
// import { APP_CONTEXT, ELEMENT_CONTEXT, CHILDREN, INPUTS } from "../keys.js";

// export type Constructor<T> = { new (...args: any[]): T };

// export interface ComponentConfig<I> {
//   appContext: AppContext;
//   elementContext: ElementContext;
//   channelPrefix?: string;
//   label?: string;
//   inputs?: I;
//   children?: Markup[];
// }

// export interface ComponentContext {
//   debug: DebugChannel;

//   get isConnected(): boolean;

//   onConnect(callback: () => void): void;
//   onDisconnect(callback: () => void): void;

//   observe<T>(readable: Readable<T>, callback: (value: T) => void): void;
//   observe<T extends Readable<any>[], V>(readables: T, callback: (...value: ValuesOfReadables<T>) => void): void;

//   useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
//   useStore<O, S extends { setup(): O }>(store: S): O;

//   crash(error: Error): void;
// }

// /**
//  * Base class representing all user-created things that are rendered as HTML elements.
//  */
// export abstract class Component<I> extends Connectable implements ComponentContext {
//   static isComponent<I = unknown>(value: any): value is Constructor<Component<I>> {
//     return value?.prototype instanceof Component;
//   }

//   #isConnected = false;

//   #stopObserverCallbacks: (() => void)[] = [];
//   #connectCallbacks: (() => void)[] = [];
//   #disconnectCallbacks: (() => void)[] = [];

//   inputs: InputsAPI<UnwrapReadables<I>>;
//   debug: DebugChannel;

//   [APP_CONTEXT]: AppContext;
//   [ELEMENT_CONTEXT]: ElementContext;
//   [CHILDREN]: Writable<Markup[]>;
//   [INPUTS]: Inputs<I>;

//   constructor(config: ComponentConfig<I>) {
//     super();

//     this[APP_CONTEXT] = config.appContext;
//     this[ELEMENT_CONTEXT] = config.elementContext;
//     this[CHILDREN] = new Writable(config.children ?? []);

//     const inputs = new Inputs<I>(config.inputs!);
//     this[INPUTS] = inputs;
//     this.inputs = inputs.api;

//     const channelName = `${config.channelPrefix ?? "component"}:${config.label ?? "(anonymous)"}`;
//     this.debug = config.appContext.debugHub.channel(channelName);
//   }

//   /*=================================*\
//   ||      Author-defined Methods     ||
//   \*=================================*/

//   // Setup function configures the component instance. This is written by the author.
//   setup(): unknown {
//     throw new Error(`Implement this function.`);
//   }

//   loading?: () => Renderable;

//   /*=================================*\
//   ||   Context Methods for Authors   ||
//   \*=================================*/

//   get isConnected(): boolean {
//     return this.#isConnected;
//   }

//   onConnect(callback: () => void) {
//     this.#connectCallbacks.push(callback);
//   }

//   onDisconnect(callback: () => void) {
//     this.#disconnectCallbacks.push(callback);
//   }

//   observe<T>(readable: Readable<T>, callback: (value: T) => void): void;
//   observe<T extends Readable<any>[], V>(readables: T, callback: (...value: ValuesOfReadables<T>) => void): void;

//   observe(readable: Readable<any> | Readable<any>[], callback: (...args: any[]) => void) {
//     const readables: Readable<any>[] = [];

//     if (Array.isArray(readable) && readable.every(Readable.isReadable)) {
//       readables.push(...readable);
//     } else if (Readable.isReadable(readable)) {
//       readables.push(readable);
//     } else {
//       throw new TypeError(`Expected one Readable or an array of Readables as the first argument.`);
//     }

//     if (readables.length === 0) {
//       throw new TypeError(`Expected at least one readable.`);
//     }

//     const start = (): StopFunction => {
//       if (readables.length > 1) {
//         return Readable.merge(readables, callback).observe(() => {});
//       } else {
//         return readables[0].observe(callback);
//       }
//     };

//     if (this.isConnected) {
//       // If called when the component is connected, we assume this code is in a lifecycle hook
//       // where it will be triggered at some point again after the component is reconnected.
//       this.#stopObserverCallbacks.push(start());
//     } else {
//       // This should only happen if called in the body of the setup function.
//       // This code is not always re-run between when a component is disconnected and reconnected.
//       this.#connectCallbacks.push(() => {
//         this.#stopObserverCallbacks.push(start());
//       });
//     }
//   }

//   // useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
//   // useStore<S extends Store<any, any>>(store: S): S extends Store<any, infer U> ? U : never;

//   useStore<N extends keyof BuiltInStores>(name: N): BuiltInStores[N];
//   useStore<S extends StoreConstructor<any>>(store: S): ReturnType<S["setup"]>;

//   useStore(store: keyof BuiltInStores | StoreConstructor<any>) {
//     const appContext = this[APP_CONTEXT];
//     const elementContext = this[ELEMENT_CONTEXT];
//     const debugChannel = this.debug;

//     if (typeof store === "string") {
//       store = store as keyof BuiltInStores;

//       if (appContext.stores.has(store)) {
//         const _store = appContext.stores.get(store)!;

//         if (!_store.instance) {
//           throw new Error(
//             `Store '${store}' was accessed before it was set up. Make sure '${store}' is registered before components that access it.`
//           );
//         }

//         return _store.instance.outputs;
//       }
//     } else {
//       const name = store.name;

//       if (elementContext.stores.has(store)) {
//         if (appContext.stores.has(store)) {
//           // Warn if shadowing a global, just in case this isn't intended.
//           debugChannel.warn(`Using local store '${name}' which shadows global store '${name}'.`);
//         }

//         return elementContext.stores.get(store)!.instance!.outputs;
//       }

//       if (appContext.stores.has(store)) {
//         const _store = appContext.stores.get(store)!;

//         if (!_store.instance) {
//           throw new Error(
//             `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
//           );
//         }

//         return _store.instance.outputs;
//       }

//       throw new Error(`Store '${name}' is not registered on this app.`);
//     }
//   }

//   crash(error: Error) {
//     this[APP_CONTEXT].crashCollector.crash({ error, component: this });
//   }

//   /*=================================*\
//   ||        Framework Methods        ||
//   \*=================================*/

//   __setChildren(children: Markup[]) {
//     this[CHILDREN].set(children);
//   }

//   async __connect(parent: Node, after?: Node) {
//     this.#isConnected = true;
//     for (const callback of this.#connectCallbacks) {
//       callback();
//     }
//   }

//   async __disconnect() {
//     for (const callback of this.#stopObserverCallbacks) {
//       callback();
//     }
//     this.#stopObserverCallbacks = [];

//     this.#isConnected = false;
//     for (const callback of this.#disconnectCallbacks) {
//       callback();
//     }
//   }
// }
