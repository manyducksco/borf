import { Readable, Writable, type StopFunction } from "./Writable.js";
import { Connectable } from "./Connectable.js";
import { type Renderable } from "./Markup.js";
import { type AppContext, type ElementContext } from "./App.js";
import { type ComponentCore } from "../scratch.js";

// ----- Types ----- //

export type RepeatContext = Omit<ComponentCore<any>, "inputs">;

interface RepeatOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  readable: Readable<Iterable<T>>;
  render: ($value: Readable<T>, $index: Readable<number>, ctx: RepeatContext) => Renderable;
  key?: (value: T, index: number) => any;
}

type ConnectedItem<T> = {
  key: any;
  $$value: Writable<T>;
  $$index: Writable<number>;
  connectable: Connectable;
};

// ----- Code ----- //

export class Repeat<T> implements Connectable {
  #node = document.createComment("Repeat");
  #readable: Readable<Iterable<T>>;
  #stopCallback?: StopFunction;
  #connectedItems: ConnectedItem<T>[] = [];
  #appContext;
  #elementContext;
  #render: ($value: Readable<T>, $index: Readable<number>, ctx: RepeatContext) => Renderable;
  #keyFn;

  get node() {
    return this.#node;
  }

  get isConnected() {
    return this.node?.parentNode != null;
  }

  constructor({ appContext, elementContext, readable, render, key }: RepeatOptions<T>) {
    this.#appContext = appContext;
    this.#elementContext = elementContext;

    this.#readable = readable;
    this.#render = render;
    this.#keyFn = key ?? ((x) => x);
  }

  async connect(parent: Node, after?: Node) {
    if (!this.isConnected) {
      parent.insertBefore(this.#node, after?.nextSibling ?? null);

      this.#stopCallback = this.#readable.observe((value) => {
        this.#update(value);
      });
    }
  }

  async disconnect() {
    if (this.#stopCallback) {
      this.#stopCallback();
      this.#stopCallback = undefined;
    }

    if (this.isConnected) {
      this.#node.parentNode!.removeChild(this.#node);
    }
  }

  async #cleanup() {
    while (this.#connectedItems.length > 0) {
      // TODO: Handle errors
      this.#connectedItems.pop()?.connectable.disconnect();
    }
  }

  async #update(value: Iterable<T>) {
    if (value == null || !this.isConnected) {
      return this.#cleanup();
    }

    type UpdateItem = { key: any; value: T; index: number };

    const potentialItems: UpdateItem[] = [];
    let index = 0;

    for (const item of value) {
      potentialItems.push({
        key: this.#keyFn(item, index),
        value: item,
        index: index++,
      });
    }

    const newItems: ConnectedItem<T>[] = [];

    // Disconnect views for items that no longer exist.
    for (const connected of this.#connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        // TODO: Handle errors
        connected.connectable.disconnect();
      }
    }

    // Add new views and update state for existing ones.
    for (const potential of potentialItems) {
      const connected = this.#connectedItems.find((item) => item.key === potential.key);

      if (connected) {
        connected.$$value.value = potential.value;
        connected.$$index.value = potential.index;
        newItems[potential.index] = connected;
      } else {
        const $$value = new Writable(potential.value);
        const $$index = new Writable(potential.index);

        newItems[potential.index] = {
          key: potential.key,
          $$value,
          $$index,
          connectable: this.#markup.init({
            appContext: this.#appContext,
            elementContext: this.#elementContext,
            inputs: { value: $$value, index: $$index },
          }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the view is already connected.
    for (const item of newItems) {
      // TODO: Handle errors
      item.connectable.connect(this.#node.parentNode!);
    }

    this.#connectedItems = newItems;
  }
}
