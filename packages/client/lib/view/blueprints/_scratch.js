const Example = new Blueprint(
  withAttribute("value", {
    default: "Default Title",
  }),
  (ctx) => {
    return <h1>{ctx.attrs.readable("value")}</h1>;
  }
);

const view = Example.create({
  appContext,
  elementContext,
  attributes,
  children,
});

class Trait {
  get name() {
    return "";
  }

  constructor() {}
}

class AttributeTrait extends Trait {
  get name() {
    return "attribute";
  }

  setup(ctx) {}
}

// class ElementBlueprint extends Blueprint {
//   supportedTraits = [];
//
//   create(context) {
//     return new
//   }
// }

/**
 * Creates views.
 */
class Blueprint {
  supportedTraits = ["name", "attribute"];
  traits = [];
  fn;

  get isBlueprint() {
    return true;
  }

  constructor(...args) {
    this.fn = args.pop();
    this.traits = args;

    if (!isFunction(this.fn)) {
      throw new TypeError("Expected a function as the last argument. Got: " + this.fn);
    }

    for (const trait of this.traits) {
      if (!this.supportedTraits.includes(trait.name)) {
        throw new TypeError(`Trait '${trait.name}' is not supported by this blueprint.`);
      }
    }
  }

  create(context) {
    return new View({
      ...context,
      fn: this.fn,
      traits: this.traits,
    });
  }
}

class View {
  channelPrefix = "view";
  lifecycleCallbacks = {
    beforeConnect: [],
    afterConnect: [],
    beforeDisconnect: [],
    afterDisconnect: [],
  };
  subscriptions = [];

  get isView() {
    return true;
  }

  get node() {
    return this.view.node;
  }

  get isConnected() {
    return this.view.isConnected;
  }

  constructor({ fn, traits, attributes, children, appContext, elementContext }) {
    const name = traits.find((t) => t.name === "name")?.value || "<unnamed>";

    this.channel = appContext.debug.makeChannel(`${this.channelPrefix}:${name}`);
    this.attributes = new Attributes({
      attributes: omit(["transitions"], attributes),
      channel: this.channel,
      traits: traits.filter((t) => t.name === "attribute"),
    });

    this.appContext = appContext;
    this.elementContext = elementContext;

    this.$$children = makeState(children ?? []);

    if (fn) {
      const ctx = new ViewContext(this);
      const result = fn(ctx);

      if (result !== null) {
        if (result.isBlueprint) {
          this.view = result.create({ appContext, elementContext });
        } else if (isDOM(result)) {
          this.view = new DOMAdapterView(result);
        } else {
          throw new TypeError(`View functions must return a blueprint, a DOM node or null. Got: ${result}`);
        }
      }
    } else {
      // If no function is passed, display children.
      this.view = new ObserverBlueprint(this.$$children.readable()).create({ appContext, elementContext });
    }
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    if (!wasConnected) {
      this.attributes.controls.connect();

      if (this.blueprint && !this.view) {
        this.view = this.blueprint.create({});
      }

      for (const callback of this.lifecycleCallbacks.beforeConnect) {
        callback();
      }
    }

    this.view.connect(parent, after);

    if (!wasConnected) {
      setTimeout(() => {
        for (const callback of this.lifecycleCallbacks.afterConnect) {
          callback();
        }
      }, 0);
    }
  }

  disconnect() {
    if (this.isConnected) {
      for (const callback of this.lifecycleCallbacks.beforeDisconnect) {
        callback();
      }

      this.view.disconnect();

      setTimeout(() => {
        for (const callback of this.lifecycleCallbacks.afterDisconnect) {
          callback();
        }

        for (const subscription of this.subscriptions) {
          subscription.unsubscribe();
        }
        this.subscriptions = [];
      }, 0);
    }

    this.attributes.controls.disconnect();
  }
}

/**
 * Wraps a raw DOM node as a view.
 */
class DOMAdapterView {
  constructor(node) {
    this.node = node;
  }

  get isView() {
    return true;
  }

  get isConnected() {
    this.node.parentNode != null;
  }

  connect(parent, after = null) {
    parent.insertBefore(this.node, after ? after.nextSibling : null);
  }

  disconnect() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
  }
}

class ViewContext {
  #view;

  constructor(view) {
    this.#view = view;

    this[APP_CONTEXT] = view.appContext;
    this[ELEMENT_CONTEXT] = view.elementContext;

    this.attrs = view.attributes.api;

    // Add debug methods.
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(view.channel));
    Object.defineProperties(this, {
      name: {
        get() {
          return view.channel.name;
        },
        set(value) {
          view.channel.name = `${view.channelPrefix}:${value}`;
        },
      },
    });
  }

  observe(...args) {
    let callback = args.pop();

    if (args.length === 0) {
      throw new TypeError(`Observe requires at least one observable.`);
    }

    const start = () => {
      if (isObservable(args.at(0))) {
        const $merged = joinStates(...args, callback);
        return $merged.subscribe(() => undefined);
      } else {
        const $merged = joinStates(...args, () => undefined);
        return $merged.subscribe(callback);
      }
    };

    if (this.#view.isConnected) {
      // If called when the view is connected, we assume this code is in a lifecycle hook
      // where it will be triggered at some point again after the view is reconnected.
      this.#view.subscriptions.push(start());
    } else {
      // This should only happen if called in the body of the view.
      // This code is not always re-run between when a view is disconnected and reconnected.
      this.#view.lifecycleCallbacks.afterConnect.push(() => {
        this.#view.subscriptions.push(start());
      });
    }
  }

  global(name) {
    if (!isString(name)) {
      throw new TypeError("Expected a string.");
    }

    if (this.#view.appContext.globals[name]) {
      return this.#view.appContext.globals[name].exports;
    }

    throw new Error(`Global '${name}' is not registered on this app.`);
  }

  local(name) {
    if (!isString(name)) {
      throw new TypeError("Expected a string.");
    }

    if (this.#view.elementContext.locals?.[name]) {
      return this.#view.elementContext.locals[name].exports;
    }

    throw new Error(`Local '${name}' is not connected upview.`);
  }

  beforeConnect(callback) {
    this.#view.lifecycleCallbacks.beforeConnect.push(callback);
  }

  afterConnect(callback) {
    this.#view.lifecycleCallbacks.afterConnect.push(callback);
  }

  beforeDisconnect(callback) {
    this.#view.lifecycleCallbacks.beforeDisconnect.push(callback);
  }

  afterDisconnect(callback) {
    this.#view.lifecycleCallbacks.afterDisconnect.push(callback);
  }

  outlet() {
    return new ObserverBlueprint(this.#view.$$children.readable());
  }
}

class Attributes {}
