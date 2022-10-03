import { isFunction } from "../../helpers/typeChecking.js";
import { toBlueprints } from "../helpers/toBlueprints.js";

/**
 * Wraps a binding in a view.
 */
export class OutletBlueprint {
  constructor(binding, render) {
    this.binding = binding;
    this.render = render || ((x) => x);
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return new OutletView(this.binding, this.render, { appContext, elementContext });
  }
}

class OutletView {
  constructor(binding, render, { appContext, elementContext }) {
    this.node = document.createComment("outlet");
    this.binding = binding;
    this.render = render;
    this.appContext = appContext;
    this.elementContext = elementContext;
    this.connectedViews = [];
  }

  get isView() {
    return true;
  }

  get isConnected() {
    return this.node.parentNode != null;
  }

  _unrender() {
    while (this.connectedViews.length > 0) {
      this.connectedViews.pop().disconnect();
    }
  }

  _render(value) {
    if (value == null) {
      return this._unrender();
    }

    let rendered = this.render ? this.render(value) : value;

    // Render function returned a function (that should return an element).
    if (rendered && isFunction(rendered)) {
      rendered = rendered();
    }

    // Render function didn't return anything.
    if (rendered === undefined) {
      throw new TypeError(`Outlet: render function returned undefined.`);
    }

    this._unrender();

    if (rendered != null) {
      const blueprints = toBlueprints(rendered);

      for (const blueprint of blueprints) {
        // Insert each view after the previous one.
        let previous = this.connectedViews[this.connectedViews.length - 1]?.node || this.node;

        const view = blueprint.build({
          appContext: this.appContext,
          elementContext: this.elementContext,
        });
        view.connect(this.node.parentNode, previous);

        this.connectedViews.push(view);
      }
    }
  }

  setChildren(...args) {}

  connect(parent, after = null) {
    if (!this.isConnected) {
      parent.insertBefore(this.node, after?.nextSibling);
      this.subscription = this.binding.subscribe((value) => {
        this._render(value);
      });
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.subscription.unsubscribe();
      this.node.parentNode.removeChild(this.node);
      this._unrender();
    }
  }
}