import type z from "zod";
import { Type, Timer } from "@borf/bedrock";
import { Markup, m, type MarkupFunction, formatChildren } from "./Markup.js";
import { Outlet } from "./Outlet.js";
import { type InputDefinition } from "./Inputs.js";
import {
  Component,
  ComponentContext,
  type CreateComponentConfig,
  type ComponentContextConfig,
  type ComponentContextControls,
  type ComponentDefinition,
  ComponentInstance,
  type ComponentInstanceConfig,
} from "./Component.js";
import { type DebugChannel } from "./DebugHub.js";
import { type StoreRegistration } from "./App.js";

// ----- Types ----- //

export type StoreSetupFunction<I, O> = (ctx: StoreContext<I>, m: MarkupFunction) => O;

export type Storable<I, O> = Store<I, O> | StoreSetupFunction<I, O>;

interface StoreDefinition<I, O> extends ComponentDefinition<I> {
  /**
   * Configures the store and returns an exports object.
   */
  setup: StoreSetupFunction<I, O>;
}

interface CreateStoreConfig<I> extends CreateComponentConfig<I> {}

/*================================*\
||           View Object          ||
\*================================*/

/**
 * A visual component that expresses part of your app in DOM nodes.
 */
export class Store<I, O> extends Component<I> {
  definition: StoreDefinition<I, O>;

  constructor(definition: StoreDefinition<I, O>) {
    super(definition);

    this.definition = definition;
  }

  create(config: CreateStoreConfig<I>): StoreInstance<I, O> {
    return new StoreInstance({
      ...config,
      setup: this.definition.setup,
      component: this,
      inputDefs: this.definition.inputs,
      children: config.children ?? [],
    });
  }

  // ----- Static ----- //

  // Full inference using Zod schemas in input config.
  static define<
    D extends StoreDefinition<any, any>,
    I = {
      [K in keyof D["inputs"]]: D["inputs"][K] extends InputDefinition<any>
        ? D["inputs"][K]["schema"] extends z.ZodType
          ? z.infer<D["inputs"][K]["schema"]>
          : never
        : never;
    },
    O extends object = ReturnType<D["setup"]>
  >(definition: StoreDefinition<I, O>): Store<I, O extends Promise<infer U> ? U : O>;

  static define<I, O extends object>(definition: StoreDefinition<I, O>) {
    if (!definition.label) {
      console.trace(
        `Store is defined without a label. Setting a label is recommended for easier debugging and error tracing.`
      );
    }

    return new Store(definition) as any;
  }

  static isStore<I = unknown, O = unknown>(value: any): value is Store<I, O> {
    return value instanceof Store;
  }
}

/*================================*\
||          Setup Context         ||
\*================================*/

interface StoreContextConfig<I> extends ComponentContextConfig<I> {}

export class StoreContext<I> extends ComponentContext<I> {
  constructor(config: StoreContextConfig<I>) {
    super(config);
  }
}

/*================================*\
||            Instance            ||
\*================================*/

export interface StoreInstanceConfig<I, O> extends ComponentInstanceConfig<I> {
  setup: StoreSetupFunction<I, O>;
}

export class StoreInstance<I, O> extends ComponentInstance<I> {
  config: StoreInstanceConfig<I, O>;
  context: StoreContext<I>;
  outlet: Outlet<any>;
  contextControls!: ComponentContextControls<I>;
  debugChannel: DebugChannel;
  logger: DebugChannel;
  outputs?: O;

  get node() {
    return this.outlet.node;
  }

  constructor(config: StoreInstanceConfig<I, O>) {
    super(config);

    this.config = {
      ...config,
      elementContext: {
        ...config.elementContext,

        // Add self to elementContext.stores
        stores: new Map([
          ...config.elementContext.stores.entries(),
          [
            config.component as Store<any, any>,
            { store: config.component as Store<any, any>, instance: this } as StoreRegistration<any>,
          ],
        ]),
      },
    };

    const channelName = `${config.channelPrefix ?? "store"}:${config.component.label}`;
    this.debugChannel = config.appContext.debugHub.channel(channelName);
    this.logger = config.appContext.debugHub.logger(channelName);

    this.context = new StoreContext({
      ...config,
      debugChannel: this.debugChannel,
      $$children: this.$$children,
      setControls: (contextControls) => {
        this.contextControls = contextControls;
      },
    });

    this.outlet = new Outlet({
      readable: this.$$children,
      appContext: config.appContext,
      elementContext: config.elementContext,
    });
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
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      await this.#initialize(parent, after); // Run setup() to configure the view.
      this.contextControls.inputs.connect();
    }

    this.outlet.connect(parent, after);

    if (!wasConnected) {
      this.contextControls.connect();
    }

    this.logger.log(`connected in ${timer.formatted}`);
  }

  /**
   * Disconnects this view from the DOM and runs lifecycle hooks.
   */
  async disconnect() {
    if (!this.isConnected) {
      return Promise.resolve();
    }

    const timer = new Timer();

    this.outlet.disconnect();
    this.contextControls.disconnect();
    this.contextControls.inputs.disconnect();

    this.logger.log("disconnected in " + timer.formatted);
  }

  /**
   * Prepares this view to be connected, handling loading state if necessary.
   *
   * @param parent - DOM node to connect loading content to.
   * @param after - Sibling DOM node directly after which this view's node should appear.
   */
  async #initialize(parent: Node, after?: Node) {
    const { appContext, elementContext } = this.config;

    let outputs: unknown;

    try {
      outputs = this.config.setup(this.context, m);
    } catch (error) {
      if (error instanceof Error) {
        appContext.crashCollector.crash({ error, component: this.config.component });
      } else {
        throw error;
      }
    }

    // Display loading content while setup promise pends.
    if (Type.isPromise(outputs)) {
      let cleanup;

      if (Type.isFunction(this.loading)) {
        // Render contents from loading() while waiting for setup to resolve.
        const content = formatChildren(this.loading(m))[0];

        if (content === undefined) {
          throw new TypeError(`loading() must return a markup element, or null to render nothing. Returned undefined.`);
        }

        if (content !== null) {
          // m() returns a Markup with something in it. Either an HTML tag, a view setup function or a connectable class.
          // Markup.init(config) is called, which passes config stuff to the connectable's constructor.
          if (!Markup.isMarkup(content)) {
            throw new TypeError(
              `loading() must return a markup element, or null to render nothing. Returned ${content}.`
            );
          }
        }

        const component = content.init({ appContext, elementContext });
        component.connect(parent, after);

        cleanup = () => component.disconnect();
      }

      try {
        outputs = await outputs;
      } catch (error) {
        if (error instanceof Error) {
          appContext.crashCollector.crash({ error, component: this.config.component });
        } else {
          throw error;
        }
      }

      if (cleanup) {
        cleanup();
      }
    }

    if (!(outputs != null && typeof outputs === "object" && !Array.isArray(outputs))) {
      throw new TypeError(`A store setup function must return an object. Got: ${outputs}`);
    }

    this.outputs = outputs as O;
  }
}
