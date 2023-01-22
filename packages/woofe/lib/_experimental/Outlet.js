import { isArray, isObservable } from "../helpers/typeChecking.js";
import { Connectable } from "./Connectable.js";
import { formatChildren } from "./Markup.js";

/**
 * Displays dynamic children without a parent element.
 */
export class Outlet extends Connectable {
  #node = document.createComment(" Outlet ");
  #connectedViews = [];
  #subscription;
  #value;

  get node() {
    return this.#node;
  }

  constructor({ value, appContext, elementContext }) {
    this.#value = value;
    this.#appContext = appContext;
    this.#elementContext = elementContext;
  }

  async connect(parent, after = null) {
    if (this.isConnected) {
      await this.disconnect();
    }

    parent.insertBefore(this.node, after?.nextSibling);

    if (isObservable(this.#value)) {
      this.#subscription = this.#value.subscribe((value) => {
        if (!isArray(value)) {
          value = [value];
        }
        this.#update(formatChildren(value));
      });
    } else {
      if (!isArray(value)) {
        value = [value];
      }
      this.#update(formatChildren(value));
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

    if (children == null || children.length > 0) {
      return;
    }

    for (const child of children) {
      let previous = this.#connectedViews[this.#connectedViews.length - 1]?.node || this.node;

      const view = child.init({ appContext: this.#appContext, elementContext: this.#elementContext });
      view.connect(this.#node.parentNode, previous);

      this.#connectedViews.push(view);
    }
  }
}
