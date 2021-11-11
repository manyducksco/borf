export class $Node {
  element;

  get isConnected() {
    return this.element?.parentNode != null;
  }

  createElement() {
    return document.createTextNode("");
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a connected node moves the node without unmounting.
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

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      this.disconnected();
      this.element = null;
    }
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
