import { Type } from "@borf/bedrock";
import { Connectable } from "./Connectable.js";
import { Markup } from "./Markup.js";

/**
 * Displays dynamic children without a parent element.
 */
export class Outlet extends Connectable {
  #node = document.createComment("Outlet");
  #connectedViews = [];
  #subscription;
  #value;
  #renderFn; // A render function: (value) => some renderable value.
  #appContext;
  #elementContext;

  get node() {
    return this.#node;
  }

  constructor({ value, renderFn, appContext, elementContext }) {
    super();

    this.#value = value;
    this.#renderFn = renderFn;
    this.#appContext = appContext;
    this.#elementContext = elementContext;
  }

  async connect(parent, after = null) {
    if (this.isConnected) {
      await this.disconnect();
    }

    parent.insertBefore(this.node, after?.nextSibling);

    if (Type.isObservable(this.#value)) {
      this.#subscription = this.#value.subscribe((value) => {
        if (this.#renderFn) {
          value = this.#renderFn(value);
        }
        this.#update(value);
      });
    } else {
      if (this.#renderFn) {
        value = this.#renderFn(value);
      }
      this.#update(value);
    }
  }

  async disconnect() {
    if (this.#subscription) {
      this.#subscription.unsubscribe();
      this.#subscription = null;
    }

    if (this.isConnected) {
      this.#node.parentNode.removeChild(this.node);
      this.#cleanup();
    }
  }

  setChildren(children) {
    console.warn("Called setChildren on an outlet, which doesn't support setting children.");
  }

  #cleanup() {
    while (this.#connectedViews.length > 0) {
      this.#connectedViews.pop().disconnect();
    }
  }

  #update(children) {
    this.#cleanup();

    if (children == null) {
      return;
    }

    if (!Type.isArray(children)) {
      children = [children];
    }

    for (const child of children) {
      let previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;
      let view = child;

      if (child instanceof Markup) {
        view = child.init({ appContext: this.#appContext, elementContext: this.#elementContext });
      }

      view.connect(this.#node.parentNode, previous);

      this.#connectedViews.push(view);
    }
  }
}
