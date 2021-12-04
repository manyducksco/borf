import { state } from "../data/state";
import { isFunction } from "../_helpers/typeChecking";
import { $Node } from "./$Node";
import { makeRender } from "./makeRender";

/**
 * Call a render function that returns a new element to display when a value changes.
 * Function receives the current value as a first argument.
 */
export class $Watch extends $Node {
  source;
  createItem;
  connectedItem;
  unlisten;

  constructor(source, createItem) {
    super();
    this.source = isFunction(source) ? source : state(source);
    this.createItem = createItem;
  }

  update(value) {
    if (!this.isConnected) {
      return;
    }

    let newElement = this.createItem(value);

    if (newElement != null) {
      newElement = makeRender(newElement)();
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
    if (!this.unlisten) {
      this.unlisten = this.source(this.update.bind(this));
    }

    this.update(this.source());
  }

  disconnected() {
    if (this.connectedItem) {
      this.connectedItem.disconnect();
    }

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
