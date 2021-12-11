export class $Node {
  $element;

  get $isNode() {
    return true;
  }

  get $isConnected() {
    return this.$element?.parentNode != null;
  }

  createElement() {
    return document.createTextNode("");
  }

  $connect(parent, after = null) {
    const wasConnected = this.$isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.$element = this.createElement();
      this._beforeConnect();
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
  }

  _beforeConnect() {}
  _connected() {}
  _beforeDisconnect() {}
  _disconnected() {}
}
