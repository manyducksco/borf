import { makeState } from "./state/makeState.js";
import { $Node } from "./dolla/$Node.js";
import {
  isDolla,
  isFunction,
  isNode,
  isState,
} from "../_helpers/typeChecking.js";

export class Component extends $Node {
  static get isComponent() {
    return true;
  }

  #getService;
  #root; // mounted node from createElement
  #dolla;

  watchers = [];

  attributes;
  children;

  get $isConnected() {
    return this.#root && this.#root.$isConnected;
  }

  constructor(getService, dolla, attributes = {}, children = []) {
    super();

    this.#getService = getService;
    this.#dolla = dolla;

    this.attributes = {};

    // Any attribute that isn't already a state or function becomes a state.
    for (const key in attributes) {
      if (isState(attributes[key]) || isFunction(attributes[key])) {
        this.attributes[key] = attributes[key];
      } else {
        this.attributes[key] = makeState(attributes[key], {
          settable: false,
        });
      }
    }

    this.children = children;

    if (isFunction(this._created)) {
      this._created();
    }
  }

  service(name) {
    return this.#getService(name);
  }

  createElement($) {
    throw new Error(`Component needs a 'createElement' method`);
  }

  $connect(parent, after = null) {
    const wasConnected = this.$isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#root = this.createElement(this.#dolla);

      if (isDolla(this.#root)) {
        this.#root = this.#root();
      }

      if (!isNode(this.#root)) {
        throw new Error(
          `Component 'createElement' method must return an $(element). Received: ${
            this.#root
          }`
        );
      }

      this._beforeConnect();
    }

    this.#root.$connect(parent, after);
    this.$element = this.#root.$element;

    if (!wasConnected) {
      this._connected();
    }
  }

  $disconnect() {
    if (this.$isConnected) {
      this._beforeDisconnect();

      this.#root.$disconnect();

      this._disconnected();
      this.#root = null;
      this.$element = null;
    }

    for (const cancel of this.watchers) {
      cancel();
    }
    this.watchers = [];
  }
}
