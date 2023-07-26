import { Readable, StopFunction } from "./state.js";
import { type DOMHandle } from "./markup.js";

/**
 * Manages an array of DOMHandles.
 */
export class Outlet implements DOMHandle {
  node: Node;
  endNode: Node;
  $children: Readable<DOMHandle[]>;
  stopCallback?: StopFunction;
  connectedChildren: DOMHandle[] = [];

  constructor($children: Readable<DOMHandle[]>) {
    this.$children = $children;
    this.node = document.createComment("Outlet");
    this.endNode = document.createComment("/Outlet");
  }

  get connected() {
    return this.node?.parentNode != null;
  }

  async connect(parent: Node, after?: Node | undefined) {
    if (!this.connected) {
      parent.insertBefore(this.node, after?.nextSibling ?? null);

      this.stopCallback = this.$children.observe((children) => {
        this.update(children);
      });
    }
  }

  async disconnect() {
    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = undefined;
    }

    if (this.connected) {
      for (const child of this.connectedChildren) {
        child.disconnect();
      }
      this.connectedChildren = [];
      this.endNode.parentNode?.removeChild(this.endNode);
    }
  }

  async update(newChildren: DOMHandle[]) {
    for (const child of this.connectedChildren) {
      child.disconnect();
    }

    this.connectedChildren = newChildren;

    for (let i = 0; i < this.connectedChildren.length; i++) {
      const child = this.connectedChildren[i];
      const previous = i > 0 ? this.connectedChildren[i] : undefined;
      await child.connect(this.node.parentElement!, previous?.node);
    }

    this.node.textContent = `Outlet (${newChildren.length} ${newChildren.length === 1 ? "child" : "children"})`;

    this.node.parentElement?.insertBefore(
      this.endNode,
      this.connectedChildren[this.connectedChildren.length - 1]?.node?.nextSibling ?? null
    );
  }

  async setChildren(children: DOMHandle[]) {}
}
