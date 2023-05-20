import { Readable, type StopFunction } from "./Readable.js";
import { Writable } from "./Writable.js";
import { type Markup, type DOMHandle } from "../markup.js";
import { type AppContext, type ElementContext } from "./App.js";
import { type ComponentContext, makeComponent } from "../component.js";

// ----- Types ----- //

interface RepeatOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  readable: Readable<T[]>;
  render: ($value: Readable<T>, $index: Readable<number>, ctx: ComponentContext) => Markup | Markup[] | null;
  key?: (value: T, index: number) => string | number | symbol;
}

type ConnectedItem<T> = {
  key: any;
  $$value: Writable<T>;
  $$index: Writable<number>;
  handle: DOMHandle;
};

// ----- Code ----- //

export class Repeat<T> implements DOMHandle {
  #node = document.createComment("Repeat");
  #readable: Readable<T[]>;
  #stopCallback?: StopFunction;
  #connectedItems: ConnectedItem<T>[] = [];
  #appContext;
  #elementContext;
  #render: ($value: Readable<T>, $index: Readable<number>, ctx: ComponentContext) => Markup | Markup[] | null;
  #keyFn: (value: T, index: number) => string | number | symbol;

  get node() {
    return this.#node;
  }

  get connected() {
    return this.node?.parentNode != null;
  }

  constructor({ appContext, elementContext, readable, render, key }: RepeatOptions<T>) {
    this.#appContext = appContext;
    this.#elementContext = elementContext;

    this.#readable = readable;
    this.#render = render;
    this.#keyFn = key ?? ((x) => x as any);
  }

  async connect(parent: Node, after?: Node) {
    if (!this.connected) {
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

    if (this.connected) {
      this.#node.parentNode!.removeChild(this.#node);
    }
  }

  async setChildren() {}

  async #cleanup() {
    while (this.#connectedItems.length > 0) {
      // TODO: Handle errors
      this.#connectedItems.pop()?.handle.disconnect();
    }
  }

  async #update(value: Iterable<T>) {
    if (value == null || !this.connected) {
      return this.#cleanup();
    }

    type UpdateItem = { key: string | number | symbol; value: T; index: number };

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

    // Remove views for items that no longer exist in the new list.
    for (const connected of this.#connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        await connected.handle.disconnect();
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
          handle: makeComponent({
            component: RepeatItemView,
            appContext: this.#appContext,
            elementContext: this.#elementContext,
            attributes: { $value: $$value.toReadable(), $index: $$index.toReadable(), render: this.#render },
          }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the view is already connected.
    for (const item of newItems) {
      await item.handle.connect(this.#node.parentNode!);
    }

    this.#connectedItems = newItems;
  }
}

interface RepeatItemAttrs {
  $value: Readable<any>;
  $index: Readable<number>;
  render: ($value: Readable<any>, $index: Readable<number>, ctx: ComponentContext) => Markup | Markup[] | null;
}

function RepeatItemView({ $value, $index, render }: RepeatItemAttrs, ctx: ComponentContext) {
  return render($value, $index, ctx);
}
