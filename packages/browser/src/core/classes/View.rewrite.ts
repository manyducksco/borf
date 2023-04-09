import { Type, Timer } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { Markup, m, type MarkupFunction, type Renderable, formatChildren } from "./Markup.js";
import { Outlet } from "./Outlet.js";
import { ForEach } from "./ForEach.js";
import { Readable } from "./Writable.js";
import { type Ref } from "./Ref.js";
import {
  Component,
  ComponentContext,
  type CreateComponentConfig,
  type ComponentContextConfig,
  type ComponentContextControls,
  type ComponentDefinition,
  ComponentInstance,
  ComponentInstanceConfig,
} from "./Component.js";
import { type DebugChannel } from "./DebugHub.js";

// ----- Types ----- //

export type ViewSetupFunction<I> = (ctx: ViewContext<I>, m: MarkupFunction) => Renderable;

export type Viewable<I> = View<I> | ViewSetupFunction<I>;

interface ViewDefinition<I> extends ComponentDefinition<I> {
  /**
   * Configures the view and returns elements to render.
   */
  setup: ViewSetupFunction<I>;
}

interface CreateViewConfig<I> extends CreateComponentConfig<I> {}

/*================================*\
||           View Object          ||
\*================================*/

/**
 * A visual component that expresses part of your app's state in DOM nodes.
 */
class View<I = {}> extends Component<I> {
  definition: ViewDefinition<I>;

  constructor(definition: ViewDefinition<I>) {
    super(definition);

    this.definition = definition;
  }

  create(config: CreateViewConfig<I>): Connectable {
    return new ViewInstance({
      ...config,
      setup: this.definition.setup,
      component: this,
      inputDefs: this.definition.inputs,
      children: config.children ?? [],
    });
  }

  // ----- Static ----- //

  static define<I>(definition: ViewDefinition<I>): View<I> {
    return new View(definition);
  }

  static isView<I>(value: any): value is View<I> {
    return value instanceof View;
  }

  /**
   * Takes a Readable `value` and displays `then` content when `value` is truthy, or `otherwise` content when `value` is falsy.
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
   * Takes a Readable `value` and displays `then` content when `value` is falsy.
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

        const RepeatItem = new View<ItemInputs>({
          label: "repeat",
          inputs: {
            value: {},
            index: {},
          },
          setup: view as ViewSetupFunction<ItemInputs>,
        });

        return RepeatItem.create({ ...config, channelPrefix: "borf:view" });
      });
    } else if (View.isView(view)) {
      markup = new Markup((config) => {
        return view.create({ ...config });
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
}

/*================================*\
||          Setup Context         ||
\*================================*/

interface ViewContextConfig<I> extends ComponentContextConfig<I> {
  setControls: (controls: ComponentContextControls<I>, animateControls: ViewAnimateControls) => void;
}

interface ViewAnimateControls {
  animateIn(): Promise<void>;
  animateOut(): Promise<void>;
}

export class ViewContext<I> extends ComponentContext<I> {
  #config: ViewContextConfig<I>;
  #animateInCallbacks: (() => Promise<any>)[] = [];
  #animateOutCallbacks: (() => Promise<any>)[] = [];

  constructor(config: ViewContextConfig<I>) {
    super({
      ...config,
      setControls: (controls) => {
        config.setControls(controls, {
          animateIn: async () => {
            for (const callback of this.#animateInCallbacks) {
              try {
                await callback();
              } catch (error) {
                if (error instanceof Error) {
                  this.#config.appContext.crashCollector.crash({
                    error,
                    component: this.#config.component,
                  });
                } else {
                  throw error;
                }
              }
            }
          },
          animateOut: async () => {
            for (const callback of this.#animateOutCallbacks) {
              try {
                await callback();
              } catch (error) {
                if (error instanceof Error) {
                  this.#config.appContext.crashCollector.crash({
                    error,
                    component: this.#config.component,
                  });
                } else {
                  throw error;
                }
              }
            }
          },
        });
      },
    });

    this.#config = config;

    // TODO: Run animateIn and animateOut callbacks on connect/disconnect.
  }

  /**
   * Takes a callback that performs an animation.
   * Can be called repeatedly. Each callback will be awaited in sequence before connect.
   */
  animateIn(callback: () => Promise<any>) {
    this.#animateOutCallbacks.push(callback);
  }

  /**
   * Takes a callback that performs an animation.
   * Can be called repeatedly. Each callback will be awaited in sequence before disconnect.
   */
  animateOut(callback: () => Promise<void>) {
    this.#animateOutCallbacks.push(callback);
  }

  /**
   * Displays children or subroutes of this view.
   */
  outlet(): Markup {
    return new Markup((config) => new Outlet({ ...config, readable: this.#config.$$children }));
  }
}

/*================================*\
||            Instance            ||
\*================================*/

interface ViewInstanceConfig<I> extends ComponentInstanceConfig<I> {
  setup: ViewSetupFunction<I>;
}

class ViewInstance<I> extends ComponentInstance<I> {
  config: ViewInstanceConfig<I>;
  context: ViewContext<I>;
  debugChannel: DebugChannel;
  connectable?: Connectable;
  contextControls!: ComponentContextControls<I>;
  animateControls!: ViewAnimateControls;
  ref?: Ref<HTMLElement>;

  get node() {
    return this.connectable?.node;
  }

  constructor(config: ViewInstanceConfig<I>) {
    super(config);

    this.config = config;
    this.debugChannel = config.appContext.debugHub.channel(
      `${config.channelPrefix ?? "view"}:${config.component.label}`
    );
    this.context = new ViewContext({
      ...config,
      debugChannel: this.debugChannel,
      $$children: this.$$children,
      setControls: (contextControls, animateControls) => {
        this.contextControls = contextControls;
        this.animateControls = animateControls;
      },
    });

    // const ref = config.inputs.ref
    // if (config.ref) {
    //   this.ref = config.channelPrefix;
    // }
    // this.#ref = inputs?.ref;
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
        this.contextControls.inputs.connect();
      }

      if (this.connectable) {
        this.connectable.connect(parent, after);
      }

      if (!wasConnected) {
        await this.animateControls.animateIn();

        setTimeout(() => {
          this.contextControls.connect();
          // this.#logger.log(`connected in ${timer.formatted}`);
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
      this.animateControls.animateOut();

      if (this.connectable) {
        this.connectable.disconnect();
      }

      setTimeout(() => {
        this.contextControls.disconnect();
        resolve();
      }, 0);

      this.contextControls.inputs.disconnect();
    });
  }

  /**
   * Prepares this view to be connected, handling loading state if necessary.
   *
   * @param parent - DOM node to connect loading content to.
   * @param after - Sibling DOM node directly after which this view's node should appear.
   */
  async #initialize(parent: Node, after?: Node) {
    const { appContext, elementContext } = this.config;

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

    let element: Renderable;

    try {
      element = this.config.setup(this.context, m);
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, component: this.config.component });
      } else {
        throw error;
      }
    }

    // Display loading content while setup promise pends.
    if (Type.isPromise<Renderable>(element)) {
      let cleanup;

      if (Type.isFunction(this.loading)) {
        // Render contents from loading() while waiting for setup to resolve.
        const content = formatChildren(this.loading(m))[0];
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
      this.connectable = element.init({ appContext, elementContext });

      if (this.ref) {
        // TODO: Rework Ref types if a basic Node can be stored in one. This may not always be an HTMLElement.
        this.ref.element = this.connectable.node as HTMLElement;
      }
    }
  }
}
