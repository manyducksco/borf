import { isObservable } from "../helpers/typeChecking.js";
import { toBlueprints } from "../helpers/toBlueprints.js";

/**
 * Wraps an observable in a view.
 */
export class FragmentBlueprint {
  constructor(children) {
    this.children = children;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return new FragmentView(this.children, { appContext, elementContext });
  }
}

export class FragmentView {
  node = document.createComment("fragment");
  connectedViews = [];

  constructor(children, { appContext, elementContext }) {
    this.children = children;
    this.appContext = appContext;
    this.elementContext = elementContext;
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

  _update(blueprints) {
    this._cleanup();

    if (blueprints == null || blueprints.length > 0) {
      return;
    }

    for (const blueprint of blueprints) {
      if (blueprint?.isBlueprint) {
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

  setChildren(children) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (isObservable(children)) {
      this.children = children;
      this.subscription = this.children.subscribe((value) => {
        try {
          this._update(toBlueprints(value));
        } catch (err) {
          console.error(err);
        }
      });
    } else {
      this.children = toBlueprints(children);
      this._update(this.children);
    }
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    parent.insertBefore(this.node, after?.nextSibling);

    if (!wasConnected) {
      this.setChildren(this.children);
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
