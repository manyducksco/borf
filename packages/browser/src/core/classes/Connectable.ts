/**
 * Base class for framework elements that can be connected to the DOM.
 */
export class Connectable {
  static isConnectable(value: any): value is Connectable {
    return value != null && value.prototype instanceof Connectable;
  }

  get node(): Node | undefined {
    return undefined; // Override me. Should return a DOM node when the component is connected.
  }

  get isConnected() {
    return this.node?.parentNode != null;
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
