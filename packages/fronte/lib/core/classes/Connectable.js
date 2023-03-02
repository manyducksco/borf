/**
 * Base class for components that can be connected to the DOM.
 */
export class Connectable {
  get node() {
    return null; // Override me. Should return a DOM node.
  }

  get isConnected() {
    return this.node?.parentNode != null;
  }

  async connect(parent, after) {
    parent.insertBefore(this.node, after?.nextSibling);
  }

  async disconnect() {
    if (this.isConnected) {
      this.node.parentNode.removeChild(this.node);
    }
  }
}
