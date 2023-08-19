import { type AppContext, type ElementContext } from "./App.js";
import { readable, writable, type Readable, type Writable, type StopFunction } from "./state.js";
import { makeView, type ViewContext } from "./view.js";
import { type DOMHandle, type Markup } from "./markup.js";

// ----- Types ----- //

interface RepeatOptions<T> {
  appContext: AppContext;
  elementContext: ElementContext;
  $items: Readable<T[]>;
  keyFn: (value: T, index: number) => string | number | symbol;
  renderFn: ($value: Readable<T>, $index: Readable<number>, ctx: ViewContext) => Markup | Markup[] | null;
}

type ConnectedItem<T> = {
  key: any;
  $$value: Writable<T>;
  $$index: Writable<number>;
  handle: DOMHandle;
};

// ----- Code ----- //

export class Repeat<T> implements DOMHandle {
  node: Node;
  endNode: Node;
  $items: Readable<T[]>;
  stopCallback?: StopFunction;
  connectedItems: ConnectedItem<T>[] = [];
  appContext;
  elementContext;
  renderFn: ($value: Readable<T>, $index: Readable<number>, ctx: ViewContext) => Markup | Markup[] | null;
  keyFn: (value: T, index: number) => string | number | symbol;

  get connected() {
    return this.node.parentNode != null;
  }

  constructor({ appContext, elementContext, $items, renderFn, keyFn }: RepeatOptions<T>) {
    this.appContext = appContext;
    this.elementContext = elementContext;

    this.$items = $items;
    this.renderFn = renderFn;
    this.keyFn = keyFn;

    if (appContext.mode === "development") {
      this.node = document.createComment("Repeat");
      this.endNode = document.createComment("/Repeat");
    } else {
      this.node = document.createTextNode("");
      this.endNode = document.createTextNode("");
    }
  }

  async connect(parent: Node, after?: Node) {
    if (!this.connected) {
      parent.insertBefore(this.node, after?.nextSibling ?? null);

      this.stopCallback = this.$items.observe((value) => {
        this.update(value);
      });
    }
  }

  async disconnect() {
    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = undefined;
    }

    if (this.connected) {
      this.node.parentNode?.removeChild(this.node);
      this.endNode.parentNode?.removeChild(this.endNode);
    }
  }

  async setChildren() {
    console.warn("setChildren is not implemented for repeat()");
  }

  async cleanup() {
    while (this.connectedItems.length > 0) {
      this.connectedItems.pop()?.handle.disconnect();
    }
  }

  async update(value: Iterable<T>) {
    if (value == null || !this.connected) {
      return this.cleanup();
    }

    type UpdateItem = { key: string | number | symbol; value: T; index: number };

    const potentialItems: UpdateItem[] = [];
    let index = 0;

    for (const item of value) {
      potentialItems.push({
        key: this.keyFn(item, index),
        value: item,
        index: index++,
      });
    }

    const newItems: ConnectedItem<T>[] = [];

    // Remove views for items that no longer exist in the new list.
    for (const connected of this.connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        await connected.handle.disconnect();
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
        const $$value = writable(potential.value) as Writable<T>;
        const $$index = writable(potential.index);

        newItems[potential.index] = {
          key: potential.key,
          $$value,
          $$index,
          handle: makeView({
            view: RepeatItemView,
            appContext: this.appContext,
            elementContext: this.elementContext,
            attributes: { $value: readable($$value), $index: readable($$index), renderFn: this.renderFn },
          }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the view is already connected.
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      const previous = newItems[i - 1]?.handle.node ?? this.node;
      await item.handle.connect(this.node.parentNode!, previous);
    }

    this.connectedItems = newItems;

    if (this.appContext.mode === "development") {
      this.node.textContent = `Repeat (${newItems.length} item${newItems.length === 1 ? "" : "s"})`;

      const lastItem = newItems.at(-1)?.handle.node ?? this.node;
      this.node.parentNode?.insertBefore(this.endNode, lastItem.nextSibling);
    }
  }
}

interface RepeatItemAttrs {
  $value: Readable<any>;
  $index: Readable<number>;
  renderFn: ($value: Readable<any>, $index: Readable<number>, ctx: ViewContext) => Markup | Markup[] | null;
}

function RepeatItemView({ $value, $index, renderFn }: RepeatItemAttrs, ctx: ViewContext) {
  return renderFn($value, $index, ctx);
}