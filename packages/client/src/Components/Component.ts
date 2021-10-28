/**
 * The basic Component class. It can be connected and disconnected and supports lifecycle hooks.
 * It makes no assumptions about its element other than that it is a Node (which all DOM nodes are).
 */
export class Component {
  element: Node;

  get isConnected() {
    return this.element.parentNode != null;
  }

  constructor() {
    this.element = this.createElement();
  }

  createElement(): Node {
    return document.createTextNode("");
  }

  connect(parent: Node, after?: Node): void {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting. Connecting a connected component moves the node without unmounting.
    if (!wasConnected) {
      this.beforeConnect();
    }

    parent.insertBefore(this.element, after ? after.nextSibling : null);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      this.beforeDisconnect();

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      this.disconnected();
    }
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
