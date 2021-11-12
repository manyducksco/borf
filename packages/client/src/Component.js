import { $Node } from "./$Node";

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
    return this.#element && this.#element.isConnected();
  }

  constructor(attributes = {}, children = []) {
    super();

    this.attributes = attributes;
    this.children = children;
  }

  init() {
    throw new Error(`Component needs an 'init' method`);
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.#element = this.init(this.#dolla);

      if (this.#element instanceof $Node == false) {
        throw new Error(
          `Component 'init' method must return an $(element). Received: ${typeof node}`
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
