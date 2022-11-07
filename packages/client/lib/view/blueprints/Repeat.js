import { isArray, isFunction } from "../../helpers/typeChecking.js";
import { makeState } from "../../helpers/state.js";

/**
 * Displays a dynamic list of views based on items in an array.
 */
export class RepeatBlueprint {
  constructor(binding, renderFn, keyFn) {
    this.binding = binding;
    this.renderFn = renderFn;
    this.keyFn = keyFn;
  }

  get isBlueprint() {
    return true;
  }

  build({ appContext, elementContext }) {
    return new RepeatView(this.binding, this.renderFn, this.keyFn, appContext, elementContext);
  }
}

class RepeatView {
  node = document.createComment("repeat");
  connectedItems = [];

  constructor(binding, renderFn, keyFn, appContext, elementContext) {
    this.binding = binding;
    this.renderFn = renderFn;
    this.keyFn = keyFn || ((x) => x);
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
    while (this.connectedItems.length > 0) {
      this.connectedItems.pop().view.disconnect();
    }
  }

  _update(value) {
    if (value == null || !this.isConnected) {
      return this._cleanup();
    }

    if (!isArray(value)) {
      throw new TypeError(`Repeat expects an array. Got: ${typeof value}`);
    }

    const potentialItems = value.map((item, index) => {
      return { key: this.keyFn(item, index), value: item, index };
    });
    const newItems = [];

    // Disconnect views for items that no longer exist.
    for (const connected of this.connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        connected.view.disconnect();
      }
    }

    // Add new views and update state for existing ones.
    for (const potential of potentialItems) {
      const connected = this.connectedItems.find((item) => item.key === potential.key);

      if (connected) {
        connected.$$value.set(potential.value);
        connected.$$index.set(potential.index);
        newItems[potential.index] = connected;
      } else {
        const $$value = makeState(potential.value);
        const $$index = makeState(potential.index);

        const blueprint = this.renderFn($$value.readable(), $$index.readable());

        if (!blueprint.isBlueprint) {
          throw new TypeError(`Repeat function must return an element.`);
        }

        newItems[potential.index] = {
          key: potential.key,
          $$value,
          $$index,
          view: blueprint.build({ appContext: this.appContext, elementContext: this.elementContext }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the window is already connected.
    for (const item of newItems) {
      item.view.connect(this.node.parentNode);
    }

    this.connectedItems = newItems;
  }

  connect(parent, after = null) {
    if (!this.isConnected) {
      parent.insertBefore(this.node, after?.nextSibling);

      if (isFunction(this.binding.subscribe)) {
        this.subscription = this.binding.subscribe((value) => {
          this._update(value);
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

      this._cleanup();
      this.node.parentNode.removeChild(this.node);
    }
  }
}
