import { Type } from "@borf/bedrock";
import { State } from "./State.js";
import { Connectable } from "./Connectable.js";
import { Markup } from "./Markup.js";

export class Repeat extends Connectable {
  #node = document.createComment("Repeat");
  #value;
  #subscription;
  #connectedItems = [];
  #appContext;
  #elementContext;
  #markup;
  #keyFn;

  get node() {
    return this.#node;
  }

  constructor({ appContext, elementContext, attributes }) {
    super();

    this.#appContext = appContext;
    this.#elementContext = elementContext;

    const { value, markup, keyFn } = attributes;

    this.#value = value;
    this.#markup = markup;
    this.#keyFn = keyFn || ((x) => x);
  }

  async connect(parent, after = null) {
    if (!this.isConnected) {
      parent.insertBefore(this.#node, after?.nextSibling);

      if (Type.isObservable(this.#value)) {
        this.#subscription = this.#value.subscribe((value) => {
          this.#update(value);
        });
      } else {
        this.#update(this.#value);
      }
    }
  }

  async disconnect() {
    if (this.#subscription) {
      this.#subscription.unsubscribe();
      this.#subscription = null;
    }

    if (this.isConnected) {
      this.#node.parentNode.removeChild(this.#node);
    }
  }

  async #cleanup() {
    while (this.#connectedItems.length > 0) {
      this.#connectedItems.pop().view.disconnect();
    }
  }

  async #update(value) {
    if (value == null || !this.isConnected) {
      return this.#cleanup();
    }

    if (!Type.isArray(value)) {
      throw new TypeError(`Repeat expects an array. Got: ${typeof value}`);
    }

    const potentialItems = value.map((item, index) => {
      return { key: this.#keyFn(item, index), value: item, index };
    });
    const newItems = [];

    // Disconnect views for items that no longer exist.
    for (const connected of this.#connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        connected.view.disconnect();
      }
    }

    // Add new views and update state for existing ones.
    for (const potential of potentialItems) {
      const connected = this.#connectedItems.find((item) => item.key === potential.key);

      if (connected) {
        connected.$$value.set(potential.value);
        connected.$$index.set(potential.index);
        newItems[potential.index] = connected;
      } else {
        const $$value = new State(potential.value);
        const $$index = new State(potential.index);

        newItems[potential.index] = {
          key: potential.key,
          $$value,
          $$index,
          view: this.#markup.init({
            appContext: this.#appContext,
            elementContext: this.#elementContext,
            inputs: { value: $$value, index: $$index },
          }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the view is already connected.
    for (const item of newItems) {
      item.view.connect(this.#node.parentNode);
    }

    this.#connectedItems = newItems;
  }
}
