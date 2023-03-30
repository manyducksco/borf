import { type AppContext, type ElementContext } from "./App.js";
import { Connectable } from "./Connectable.js";
import { type Markup } from "./Markup.js";

interface FragmentOptions {
  appContext: AppContext;
  elementContext: ElementContext;
  children?: Markup[];
}

/**
 * Displays static children without a parent element.
 */
export class Fragment extends Connectable {
  #node = document.createComment("Fragment");
  #children;
  #connectedViews: Connectable[] = [];
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  constructor({ children, appContext, elementContext }: FragmentOptions) {
    super();

    this.#children = children;
    this.#appContext = appContext;
    this.#elementContext = elementContext;
  }

  async connect(parent: Node, after?: Node) {
    const wasConnected = this.isConnected;

    parent.insertBefore(this.#node, after?.nextSibling ?? null);

    if (!wasConnected) {
      this.setChildren(this.#children);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      this.#node.parentNode!.removeChild(this.#node);

      for (const view of this.#connectedViews) {
        view.disconnect();
      }
      this.#connectedViews = [];
    }
  }

  setChildren(children?: Markup[]) {
    if (children == null || children.length === 0) {
      return;
    }

    this.#children = children;

    if (this.isConnected) {
      for (const child of this.#children) {
        let previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;

        const view = child.init({ appContext: this.#appContext, elementContext: this.#elementContext });
        view.connect(this.#node.parentNode!, previous);

        this.#connectedViews.push(view);
      }
    }
  }
}
