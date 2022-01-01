export class $Node {
  $element;
  #watchers = [];

  get $isNode() {
    return true;
  }

  get $isConnected() {
    return this.$element?.parentNode != null;
  }

  createElement() {
    return document.createTextNode("");
  }

  watchState(state, callback, options = {}) {
    this.#watchers.push(state.watch(callback));

    if (options.immediate) {
      callback(state.get());
    }
  }

  $connect(parent, after = null) {
    const wasConnected = this.$isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.$element = this.createElement();
      this._beforeConnect();
    }

    if (parent instanceof Node == false) {
      console.trace(parent);
    }

    parent.insertBefore(this.$element, after ? after.nextSibling : null);

    if (!wasConnected) {
      this._connected();
    }
  }

  $disconnect() {
    if (this.$isConnected) {
      this._beforeDisconnect();

      if (this.$element.parentNode) {
        this.$element.parentNode.removeChild(this.$element);
      }

      this._disconnected();
      this.$element = null;
    }

    for (const unwatch of this.#watchers) {
      unwatch();
    }
    this.#watchers = [];
  }

  _beforeConnect() {}
  _connected() {}
  _beforeDisconnect() {}
  _disconnected() {}
}
