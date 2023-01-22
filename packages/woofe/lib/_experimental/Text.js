import { isObservable } from "../helpers/typeChecking";
import { Connectable } from "./Connectable";

export class Text extends Connectable {
  #node = document.createTextNode("");
  #value = "";

  get node() {
    return this.#node;
  }

  constructor({ value }) {
    this.#value = value;
  }

  #update(value) {
    if (value != null) {
      this.#node.textContent = value;
    } else {
      this.#node.textContent = "";
    }
  }

  async connect(parent, after = null) {
    if (!this.isConnected) {
      if (isObservable(this.#value)) {
        this.#subscription = this.#value.subscribe((value) => {
          this.#update(value);
        });
      } else {
        this.#update(this.#value);
      }

      parent.insertBefore(this.#node, after?.nextSibling);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      if (this.#subscription) {
        this.#subscription.unsubscribe();
      }

      this.#node.parentNode.removeChild(this.#node);
    }
  }
}
