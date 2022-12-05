import { isFunction, isObservable } from "../../helpers/typeChecking.js";
import { toBlueprints } from "../helpers/toBlueprints.js";

/**
 * Wraps a binding in a view.
 */
export class ObserverBlueprint {
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

  _cleanup() {
    while (this.connectedViews.length > 0) {
      this.connectedViews.pop().disconnect();
    }
  }

  _update(value) {
    let rendered = this.render ? this.render(value) : value;

    this._cleanup();

    if (rendered == null) {
      return;
    }

    // Render function returned a function (that should return an element).
    if (isFunction(rendered)) {
      rendered = rendered();
    }

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
    const wasConnected = this.isConnected;

    parent.insertBefore(this.node, after?.nextSibling);

    if (!wasConnected) {
      if (isObservable(this.binding)) {
        this.subscription = this.binding.subscribe((value) => {
          // TODO: Errors are being eaten in code called from here.
          try {
            this._update(value);
          } catch (err) {
            console.error(err);
          }
        });
      } else {
        this._update(this.binding);
      }
    }
  }

  disconnect() {
    if (this.isConnected) {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      this.node.parentNode.removeChild(this.node);
      this._cleanup();
    }
  }
}
