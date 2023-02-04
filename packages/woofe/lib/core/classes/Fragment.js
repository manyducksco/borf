import { Connectable } from "./Connectable.js";
// import { formatChildren } from "./Markup.js";

/**
 * Displays static children without a parent element.
 */
export class Fragment extends Connectable {
  #node = document.createComment("Fragment");
  #children;
  #connectedViews = [];
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  constructor({ children, appContext, elementContext }) {
    super();

    this.#children = children;
    this.#appContext = appContext;
    this.#elementContext = elementContext;
  }

  async connect(parent, after = null) {
    const wasConnected = this.isConnected;

    parent.insertBefore(this.#node, after?.nextSibling);

    if (!wasConnected) {
      this.setChildren(this.#children);
    }
  }

  async disconnect() {
    this.#node.parentNode.removeChild(this.#node);

    for (const view of this.#connectedViews) {
      view.disconnect();
    }
    this.#connectedViews = [];
  }

  setChildren(children) {
    if (children == null || children.length === 0) {
      return;
    }

    this.#children = children;

    if (this.isConnected) {
      for (const child of this.#children) {
        let previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;

        const view = child.init({ appContext: this.#appContext, elementContext: this.#elementContext });
        view.connect(this.#node.parentNode, previous);

        this.#connectedViews.push(view);
      }
    }
  }
}
