/**
 * The basic Component class. It can be connected and disconnected and supports lifecycle hooks.
 * It makes no assumptions about its root other than that it is a Node (which all DOM nodes are).
 */
export class Component {
  root: Node;

  get isConnected() {
    return this.root.parentNode != null;
  }

  constructor(root: Node) {
    this.root = root;
  }

  connect(parent: Node, after?: Node): void {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting. Connecting a connected component moves the node without unmounting.
    if (!wasConnected) {
      this.beforeConnect();
    }

    parent.insertBefore(this.root, after ? after.nextSibling : null);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect(): void {
    if (this.isConnected) {
      this.beforeDisconnect();

      if (this.root.parentNode) {
        this.root.parentNode.removeChild(this.root);
      }

      this.disconnected();
    }
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
