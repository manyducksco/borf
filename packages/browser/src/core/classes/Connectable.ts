/**
 * Base class for components that can be connected to the DOM.
 */
export class Connectable {
  get node(): Node {
    return null as any; // Override me. Should return a DOM node.
  }

  get isConnected() {
    if (this.node) {
      return (this.node as Node)?.parentNode != null;
    }
    return false;
  }

  async connect(parent: Node, after: Node | null = null) {
    parent.insertBefore(this.node!, after?.nextSibling ?? null);
  }

  async disconnect() {
    if (this.isConnected) {
      this.node!.parentNode!.removeChild(this.node!);
    }
  }
}
