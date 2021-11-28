import { state } from "../data/state";
import { $Node } from "../templating/$Node";
import { isFunction } from "../_helpers/typeChecking";

export class Component extends $Node {
  static get isComponent() {
    return true;
  }

  #element;
  #dolla;

  set $(dolla) {
    this.#dolla = dolla;
  }

  app;
  http;
  attributes;
  children;

  get isConnected() {
    return this.#element && this.#element.isConnected;
  }

  constructor(attributes = {}, children = []) {
    super();

    // All attributes are turned into functions.
    // Anything that isn't a function already becomes a state.
    this.attributes = {};

    for (const key in attributes) {
      if (isFunction(attributes[key])) {
        this.attributes[key] = attributes[key];
      } else {
        this.attributes[key] = state(attributes[key], { immutable: true });
      }
    }

    this.children = children;

    if (isFunction(this.created)) {
      this.created();
    }
  }

  createElement($) {
    throw new Error(`Component needs a 'createElement' method`);
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#element = this.createElement(this.#dolla);

      if (!this.#element.isNode) {
        throw new Error(
          `Component 'createElement' method must return an $(element). Received: ${
            this.#element
          }`
        );
      }

      this.beforeConnect();
    }

    this.#element.connect(parent, after);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.beforeDisconnect();

      this.#element.disconnect();

      this.disconnected();
      this.#element = null;
    }
  }
}
