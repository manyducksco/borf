export class $Node {
  element;
  #watchers = [];

  get isNode() {
    return true;
  }

  get isConnected() {
    return this.element?.parentNode != null;
  }

  createElement() {
    return document.createTextNode("");
  }

  watchState(state, ...args) {
    this.#watchers.push(state.watch(...args));
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.element = this.createElement();
      this.beforeConnect();
    }

    parent.insertBefore(this.element, after ? after.nextSibling : null);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.beforeDisconnect();

      this.element.parentNode.removeChild(this.element);

      this.disconnected();
      this.element = null;
    }

    for (const unwatch of this.#watchers) {
      unwatch();
    }
    this.#watchers = [];
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
