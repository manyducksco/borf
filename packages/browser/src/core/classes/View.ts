import { Type, Timer } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { Inputs, InputValues, type InputDefinitions } from "./Inputs.js";
import { Markup, m, type MarkupFunction, type Renderable } from "./Markup.js";
import { Outlet } from "./Outlet.js";
import { ForEach } from "./ForEach.js";
import { Readable, StopFunction, Writable } from "./Writable.js";
import { type BuiltInStores } from "../types.js";
import { type Ref } from "./Ref.js";
import { ComponentOptions, type ComponentContext, type StoreConstructor } from "./Store.js";

// ----- Types ----- //

export type ViewConstructor<I> = {
  new (options: ViewOptions<I>): View<I>;

  label?: string;
  about?: string;
  inputs?: InputDefinitions<I>;

  __inputTypes: InputValues<I>;
};

export interface ViewContext<I> extends ComponentContext<I> {
  animateIn: (callback: () => Promise<void>) => void;
  animateOut: (callback: () => Promise<void>) => void;
  outlet: () => Markup;
}

export type ViewSetupFunction<I> = (ctx: ViewContext<I>, m: MarkupFunction) => Renderable | Promise<Renderable>;

export type Viewable<I> = ViewConstructor<I> | ViewSetupFunction<I>;

/**
 * Options passed when instantiating a View.
 */
interface ViewOptions<I> extends ComponentOptions<I> {
  setup?: ViewSetupFunction<I>; // This is passed in directly to `new View()` to turn a standalone setup function into a view.

  inputs?: InputValues<I> & { ref?: Ref<HTMLElement> };
}

type ViewDefinition<I> = {
  /**
   * Name to identify this view in the console and dev tools.
   */
  label?: string;

  /**
   * Explanation of this view.
   */
  about?: string;

  /**
   * Values passed into this view, usually as HTML attributes.
   */
  inputs?: InputDefinitions<I>;

  /**
   * Configures the view and returns elements to render.
   */
  setup: ViewSetupFunction<I>;
};

// ----- Code ----- //

export class View<Inputs = {}> extends Connectable {
  declare ___inputTypes: InputValues<Inputs>;

  static define<I>(config: ViewDefinition<I>): ViewConstructor<I> {
    if (!config.label) {
      console.trace(
        `View is defined without a label. Setting a label is recommended for easier debugging and error tracing.`
      );
    }

    return class extends View<I> {
      static about = config.about;
      static label = config.label;
      static inputs = config.inputs;

      setup = config.setup;
    } as any;
  }

  static defineDialog<I>(config: ViewDefinition<I & { open: boolean }>) {
    return View.define(config);
  }

  static isView<I = unknown>(value: any): value is ViewConstructor<I> {
    return value?.prototype instanceof View;
  }

  static isInstance<I = unknown>(value: any): value is View<I> {
    return value instanceof View;
  }

  /**
   * Takes a Readable `value`. When `value` is truthy, display `then` content. When `value` is falsy, display `otherwise` content.
   */
  static when(value: Readable<any>, then?: Renderable, otherwise?: Renderable) {
    return new Markup((config) => {
      return new Outlet({
        ...config,
        readable: value,
        render: (value) => {
          if (value) {
            return then;
          }

          if (otherwise) {
            return otherwise;
          }

          return null;
        },
      });
    });
  }

  /**
   * Takes a Readable `value`. When `value` is falsy, display `then` content.
   */
  static unless(value: Readable<any>, then: Renderable) {
    return new Markup((config) => {
      return new Outlet({
        ...config,
        readable: value,
        render: (value) => {
          if (!value) {
            return then;
          }

          return null;
        },
      });
    });
  }

  static observe<T>(readable: Readable<T>, render: (value: T) => Renderable) {
    return new Markup((config) => {
      return new Outlet({
        ...config,
        readable: readable,
        render,
      });
    });
  }

  /**
   * Displays an instance of `view` for each item in `values`. Dynamically adds and removes views as items change.
   * For complex objects with an ID, define a `key` function to select that ID.
   * Object identity (`===`) will be used for comparison if no `key` function is passed.
   *
   * TODO: Describe or link to docs where keying is explained.
   */
  static forEach<T>(
    readable: Readable<Iterable<T>>,
    view: Viewable<{ value: T; index: number }>,
    key: (value: T, index: number) => string | number
  ) {
    let markup: Markup;

    if (Type.isFunction(view)) {
      markup = new Markup((config) => {
        type ItemInputs = { value: T; index: number };

        const RepeatItem = View.define<ItemInputs>({
          label: "repeat",
          inputs: {
            value: {},
            index: {},
          },
          setup: view as ViewSetupFunction<ItemInputs>,
        });

        return new RepeatItem({ ...config, channelPrefix: "borf:view" });
      });
    } else if (View.isView(view)) {
      markup = new Markup((config) => {
        return new view({ ...config });
      });
    } else {
      throw new TypeError(`View.forEach requires a setup function or view. Got type: ${Type.of(view)}, value: ${view}`);
    }

    return new Markup((config) => {
      return new ForEach<T>({
        ...config,
        readable,
        markup,
        key,
      });
    });
  }

  label;
  about;

  loading?: (m: MarkupFunction) => Markup;

  #lifecycleCallbacks: {
    animateIn: (() => Promise<unknown>)[];
    animateOut: (() => Promise<unknown>)[];
    onConnect: (() => void)[];
    onDisconnect: (() => void)[];
  } = {
    animateIn: [],
    animateOut: [],
    onConnect: [],
    onDisconnect: [],
  };
  #stopCallbacks: StopFunction[] = [];
  #channel;
  #logger;
  #inputs;
  #element?: Connectable;
  #$$children;

  #appContext;
  #elementContext;
  #ref;

  get node() {
    return this.#element?.node;
  }

  constructor({
    appContext,
    elementContext,
    channelPrefix = "view",
    label = "<anonymous>",
    about,
    inputs,
    inputDefs,
    children = [],
    setup,
  }: ViewOptions<Inputs>) {
    super();

    this.label = label;
    this.about = about;

    if (setup) {
      this.setup = setup;
    }

    this.#appContext = appContext;
    this.#elementContext = elementContext;
    this.#ref = inputs?.ref;

    const channelName = `${channelPrefix}:${label}`;
    this.#channel = appContext.debugHub.channel(channelName);
    this.#logger = appContext.debugHub.logger(channelName);

    this.#inputs = new Inputs({
      inputs,
      definitions: inputDefs,
      enableValidation: appContext.mode === "production", // TODO: Disable for production builds (unless specified in app options).
    });

    this.#$$children = new Writable(children);
  }

  setup(ctx: ViewContext<Inputs>, m: MarkupFunction) {
    throw new Error(`This view needs a setup function.`);
  }

  setChildren(children: Markup[]) {
    this.#logger.log("updating children", children);
    this.#$$children.value = children;
  }

  /**
   * Connects this view to the DOM, running lifecycle hooks if it wasn't already connected.
   * Calling this on a view that is already connected can reorder it or move it to a different
   * place in the DOM without re-triggering lifecycle hooks.
   *
   * @param parent - DOM node under which this view should be connected as a child.
   * @param after - A child node under `parent` after which this view should be connected.
   */
  async connect(parent: Node, after?: Node) {
    const timer = new Timer();

    return new Promise<void>(async (resolve) => {
      const wasConnected = this.isConnected;

      if (!wasConnected) {
        await this.#initialize(parent, after); // Run setup() to configure the view.
        this.#inputs.connect();
      }

      if (this.#element) {
        this.#element.connect(parent, after);
      }

      if (!wasConnected) {
        if (this.#lifecycleCallbacks.animateIn.length > 0) {
          try {
            await Promise.all(this.#lifecycleCallbacks.animateIn.map((callback) => callback()));
          } catch (error) {
            if (error instanceof Error) {
              this.#appContext.crashCollector.crash({ error, component: this });
            } else {
              throw error;
            }
          }
        }

        setTimeout(() => {
          for (const callback of this.#lifecycleCallbacks.onConnect) {
            try {
              callback();
            } catch (error) {
              if (error instanceof Error) {
                this.#appContext.crashCollector.crash({ error, component: this });
              } else {
                throw error;
              }
            }
          }

          this.#logger.log(`connected in ${timer.formatted}`);
          resolve();
        }, 0);
      }
    });
  }

  /**
   * Disconnects this view from the DOM and runs lifecycle hooks.
   */
  async disconnect() {
    if (!this.isConnected) {
      return Promise.resolve();
    }

    return new Promise<void>(async (resolve) => {
      if (this.#lifecycleCallbacks.animateOut.length > 0) {
        try {
          await Promise.all(this.#lifecycleCallbacks.animateOut.map((callback) => callback()));
        } catch (error) {
          if (error instanceof Error) {
            this.#appContext.crashCollector.crash({ error, component: this });
          } else {
            throw error;
          }
        }
      }

      if (this.#element) {
        this.#element.disconnect();
      }

      setTimeout(() => {
        for (const callback of this.#lifecycleCallbacks.onDisconnect) {
          try {
            callback();
          } catch (error) {
            if (error instanceof Error) {
              this.#appContext.crashCollector.crash({ error, component: this });
            } else {
              throw error;
            }
          }
        }

        for (const stop of this.#stopCallbacks) {
          stop();
        }
        this.#stopCallbacks = [];

        resolve();
      }, 0);

      this.#inputs.disconnect();
    });
  }

  /**
   * Prepares this view to be connected, handling loading state if necessary.
   *
   * @param parent - DOM node to connect loading content to.
   * @param after - Sibling DOM node directly after which this view's node should appear.
   */
  async #initialize(parent: Node, after?: Node) {
    const appContext = this.#appContext;
    const elementContext = this.#elementContext;

    // Omit log methods which we will add later.
    const ctx: Omit<ViewContext<Inputs>, "log" | "warn" | "error"> = {
      inputs: this.#inputs.api,

      observe: (readable: Readable<any> | Readable<any>[], callback: (...args: any[]) => void) => {
        const readables: Readable<any>[] = [];

        if (Type.isArrayOf(Type.isInstanceOf(Readable), readable)) {
          readables.push(...readable);
        } else {
          readables.push(readable);
        }

        if (readables.length === 0) {
          throw new TypeError(`Expected at least one readable.`);
        }

        const start = (): StopFunction => {
          if (readables.length > 1) {
            return Readable.merge(readables, callback).observe(() => {});
          } else {
            return readables[0].observe(callback);
          }
        };

        if (this.isConnected) {
          // If called when the view is connected, we assume this code is in a lifecycle hook
          // where it will be triggered at some point again after the view is reconnected.
          this.#stopCallbacks.push(start());
        } else {
          // This should only happen if called in the body of the view.
          // This code is not always re-run between when a view is disconnected and reconnected.
          this.#lifecycleCallbacks.onConnect.push(() => {
            this.#stopCallbacks.push(start());
          });
        }
      },

      useStore: (nameOrStore: keyof BuiltInStores | StoreConstructor<any, any>) => {
        if (typeof nameOrStore === "string") {
          const name = nameOrStore;

          if (appContext.stores.has(name)) {
            const _store = appContext.stores.get(name)!;

            if (!_store.instance) {
              throw new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' is registered before components that access it.`
              );
            }

            return _store.instance.outputs;
          }
        } else {
          const store = nameOrStore;
          const name = store?.name || store;

          if (elementContext.stores.has(store)) {
            if (appContext.stores.has(store)) {
              // Warn if shadowing a global, just in case this isn't intended.
              this.#channel.warn(`Using local store '${name}' which shadows global store '${name}'.`);
            }

            return elementContext.stores.get(store)!.instance!.outputs;
          }

          if (appContext.stores.has(store)) {
            const _store = appContext.stores.get(store)!;

            if (!_store.instance) {
              throw new Error(
                `Store '${name}' was accessed before it was set up. Make sure '${name}' is added before other stores that access it.`
              );
            }

            return _store.instance.outputs;
          }

          throw new Error(`Store '${name}' is not registered on this app.`);
        }
      },

      animateIn: (callback: () => Promise<void>) => {
        this.#lifecycleCallbacks.animateIn.push(callback);
      },

      animateOut: (callback: () => Promise<void>) => {
        this.#lifecycleCallbacks.animateOut.push(callback);
      },

      onConnect: (callback: () => void) => {
        this.#lifecycleCallbacks.onConnect.push(callback);
      },

      onDisconnect: (callback: () => void) => {
        this.#lifecycleCallbacks.onDisconnect.push(callback);
      },

      outlet: () => {
        return new Markup((config) => new Outlet({ ...config, readable: this.#$$children }));
      },

      crash: (error: Error) => {
        appContext.crashCollector.crash({ error, component: this });
      },
    };

    // Add debug channel methods directly to context.
    Object.defineProperties(ctx, Object.getOwnPropertyDescriptors(this.#channel));
    Object.defineProperty(ctx, "isConnected", {
      get: () => this.isConnected,
    });

    const assertUsable = (element: unknown): element is Markup => {
      if (element === undefined) {
        throw new TypeError(`Views must return a markup element, or null to render nothing. Returned undefined.`);
      }

      if (element !== null) {
        // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
        // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
        if (!Markup.isMarkup(element)) {
          throw new TypeError(`Views must return a markup element, or null to render nothing. Returned ${element}.`);
        }
      }

      return true;
    };

    let element;

    try {
      element = this.setup(ctx as ViewContext<Inputs>, m);
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, component: this });
      } else {
        throw error;
      }
    }

    // Display loading content while setup promise pends.
    if (Type.isPromise(element)) {
      let cleanup;

      if (Type.isFunction(this.loading)) {
        // Render contents from loading() while waiting for setup to resolve.
        const content = this.loading(m);
        assertUsable(content);

        const component = content.init({ appContext, elementContext });
        component.connect(parent, after);

        cleanup = () => component.disconnect();
      }

      try {
        element = await element;
      } catch (error) {
        if (error instanceof Error) {
          appContext.crashCollector.crash({ error, component: this });
        } else {
          throw error;
        }
      }

      if (cleanup) {
        cleanup();
      }
    }

    if (assertUsable(element)) {
      this.#element = element.init({ appContext, elementContext });

      if (this.#ref) {
        // TODO: Rework Ref types if a basic Node can be stored in one. This may not always be an HTMLElement.
        this.#ref.element = this.#element.node as HTMLElement;
      }
    }
  }
}
