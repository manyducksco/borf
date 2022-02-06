import { makeState, isState } from "@woofjs/state";
import { $Node } from "./$Node.js";
import { makeRenderable } from "./makeRenderable.js";

/**
 * Call a render function that returns a new element to display when a value changes.
 * Function receives the current value as a first argument.
 */
export class $Watch extends $Node {
  source;
  createItem;
  connectedItem;
  unwatch;

  constructor(source, createItem) {
    super();
    this.source = isState(source) ? source : makeState(source);
    this.createItem = createItem;
  }

  update(value) {
    if (!this.isConnected) {
      return;
    }

    let newElement = this.createItem(value);

    if (newElement != null) {
      newElement = makeRenderable(newElement)();
    }

    requestAnimationFrame(() => {
      if (!this.isConnected) {
        return;
      }

      if (this.connectedItem) {
        this.connectedItem.disconnect();
      }

      if (newElement) {
        this.connectedItem = newElement;
        this.connectedItem.connect(this.element.parentNode, this.element);
      }
    });
  }

  connected() {
    if (!this.unwatch) {
      this.unwatch = this.source.watch(this.update.bind(this));
    }

    this.update(this.source.get());
  }

  disconnected() {
    if (this.connectedItem) {
      this.connectedItem.disconnect();
    }

    if (this.unwatch) {
      this.unwatch();
      this.unwatch = undefined;
    }
  }
}
