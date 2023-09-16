import { nanoid } from "nanoid";
import { type AppContext, type ElementContext } from "./App";
import { HTML } from "./HTML";
import { spring } from "./Spring";
import { m, type DOMHandle } from "./markup";
import { readable, writable, type Readable, type StopFunction, type Writable, computed } from "./state.js";
import type { IntrinsicElements, Renderable } from "./types";
import { initView, type ViewContext, type ViewResult } from "./view.js";

interface ListTransitionContext<T> {
  li: HTMLLIElement;
  item: T;
  index: number;
}

/**
 * Options passed the `list` helper function.
 */
export interface ListConfig<T> {
  ordered?: boolean;
  itemKey: (item: T, index: number) => string | number | symbol;
  itemContent: ($item: Readable<T>, $index: Readable<number>, ctx: ViewContext) => ViewResult;
  listProps?: IntrinsicElements["ol"] | IntrinsicElements["ul"];
  itemProps?: IntrinsicElements["li"];
  transitions?: {
    enter?: (ctx: ListTransitionContext<T>) => Promise<void>;
    exit?: (ctx: ListTransitionContext<T>) => Promise<void>;
  };
}

/**
 * Options passed to the List constructor.
 */
export interface ListOptions<T> {
  $source: Readable<Iterable<T>>;
  config: ListConfig<T>;
  appContext: AppContext;
  elementContext: ElementContext;
}

type PotentialItem<T> = { key: string | number | symbol; value: T; index: number };

interface ConnectedItem<T> {
  key: any;
  $$position: Writable<number>;
  $$value: Writable<T>;
  $$index: Writable<number>;
  handle: DOMHandle;
}

/**
 * Manages a list of items that update to keep in sync with a $source iterable.
 * Supports enter and exit transitions for list items.
 */
export class List<T> implements DOMHandle {
  $source: Readable<Iterable<T>>;
  config: ListConfig<T>;
  appContext;
  elementContext;
  stopCallback?: StopFunction;
  connectedItems: ConnectedItem<T>[] = [];
  mutationObserver: MutationObserver;
  $$listHeight = writable(0);
  uniqueId = nanoid();

  list: HTML;

  get node() {
    return this.list.node;
  }

  get connected() {
    return this.list.connected;
  }

  constructor(options: ListOptions<T>) {
    this.$source = options.$source;
    this.config = options.config;
    this.appContext = options.appContext;
    this.elementContext = options.elementContext;

    this.list = new HTML({
      tag: this.config.ordered ? "ol" : "ul",
      props: {
        ...(this.config.listProps ?? {}),
        style: {
          position: "relative",
          height: computed(this.$$listHeight, (h) => h + "px"),
        },
      },
      appContext: this.appContext,
      elementContext: this.elementContext,
    });

    this.mutationObserver = new MutationObserver(() => {
      this._updateMeasurements();
    });
  }

  connect(parent: Node, after?: Node) {
    const wasConnected = this.connected;

    this.list.connect(parent, after);

    if (!wasConnected) {
      this.stopCallback = this.$source.observe((items) => {
        this._update(Array.from(items));
      });
      this.mutationObserver.observe(this.list.node, { attributes: true, childList: true, subtree: true });
    }
  }

  disconnect() {
    if (this.connected) {
      this.mutationObserver.disconnect();
      this.list.disconnect();
      this._cleanup();
    }

    if (this.stopCallback) {
      this.stopCallback();
      this.stopCallback = undefined;
    }
  }

  setChildren() {}

  _updateMeasurements() {
    this.appContext.queueUpdate(() => {
      console.log("MEASURING MUTATION");

      let totalHeight = 0;

      for (const item of this.connectedItems) {
        item.$$position.set(totalHeight);
        const rect = (item.handle.node! as HTMLLIElement).getBoundingClientRect();
        totalHeight += rect.height;
      }

      this.$$listHeight.set(totalHeight);

      console.log("total height", totalHeight);
    }, this.uniqueId + "_updateMeasurements");
  }

  _cleanup() {
    for (const item of this.connectedItems) {
      this._removeItem(item);
    }
    this.connectedItems = [];
  }

  _update(items: T[]) {
    if (items.length === 0 || !this.connected) {
      return this._cleanup();
    }

    const potentialItems: PotentialItem<T>[] = [];
    let index = 0;

    for (const item of items) {
      potentialItems.push({
        key: this.config.itemKey(item, index),
        value: item,
        index: index++,
      });
    }

    const toRemove: { item: ConnectedItem<T> }[] = [];
    const toAdd: { potential: PotentialItem<T> }[] = [];
    const toUpdate: { item: ConnectedItem<T>; potential: PotentialItem<T> }[] = [];

    // Diff items; determine items to be added, removed and reordered
    for (const item of this.connectedItems) {
      const potential = potentialItems.find((p) => p.key === item.key);
      if (!potential) {
        toRemove.push({ item });
      } else {
        toUpdate.push({ item, potential });
      }
    }

    for (const potential of potentialItems) {
      const item = this.connectedItems.find((c) => c.key === potential.key);
      if (!item) {
        toAdd.push({ potential });
      }
    }

    // Do update; remove, then add, then update
    for (const { item } of toRemove) {
      this._removeItem(item);
    }

    for (const { potential } of toAdd) {
      const $$position = writable(0);
      const $$value = writable(potential.value) as Writable<T>;
      const $$index = writable(potential.index);

      const item: ConnectedItem<T> = {
        key: potential.key,
        $$position,
        $$value,
        $$index,
        handle: initView({
          view: ListItemView,
          appContext: this.appContext,
          elementContext: this.elementContext,
          props: {
            $position: readable($$position),
            $value: readable($$value),
            $index: readable($$index),
            itemContent: this.config.itemContent,
            itemProps: this.config.itemProps ?? {},
          },
        }),
      };

      this._insertItem(item);
    }

    for (const { item, potential } of toUpdate) {
      this._updateItem(item, potential);
    }

    this.connectedItems.sort((a, b) => {
      const aIndex = a.$$index.get();
      const bIndex = b.$$index.get();
      if (aIndex < bIndex) {
        return -1;
      } else {
        return +1;
      }
    });

    for (let i = 0; i < this.connectedItems.length; i++) {
      const { handle } = this.connectedItems[i];
      const previousNode = this.connectedItems[i - 1]?.handle.node;
      handle.connect(this.node, previousNode);
    }

    this._updateMeasurements();
  }

  _insertItem(item: ConnectedItem<T>) {
    const previousNode = this.connectedItems[item.$$index.get() - 1]?.handle.node;
    item.handle.connect(this.node, previousNode);
    this.connectedItems.splice(item.$$index.get(), 0, item);
    if (this.connected && this.config.transitions?.enter) {
      this.config.transitions.enter({
        li: item.handle.node as HTMLLIElement,
        item: item.$$value.get(),
        index: item.$$index.get(),
      });
    }
  }

  async _removeItem(item: ConnectedItem<T>) {
    this.connectedItems.splice(this.connectedItems.indexOf(item), 1);
    if (this.connected && this.config.transitions?.exit) {
      await this.config.transitions.exit({
        li: item.handle.node as HTMLLIElement,
        item: item.$$value.get(),
        index: item.$$index.get(),
      });

      item.handle.disconnect();
    } else {
      item.handle.disconnect();
    }
  }

  _updateItem(item: ConnectedItem<T>, potential: PotentialItem<T>) {
    item.$$value.set(potential.value);
    item.$$index.set(potential.index);
  }
}

interface ListItemViewProps {
  $position: Readable<number>;
  $value: Readable<any>;
  $index: Readable<number>;
  itemProps: Record<string, any>;
  itemContent: ($item: Readable<any>, $index: Readable<number>, ctx: ViewContext) => ViewResult;
}

function ListItemView(props: ListItemViewProps, ctx: ViewContext) {
  const $$positionSpring = spring(props.$position.get(), {
    stiffness: 800,
    damping: 60,
    mass: 1,
    endAmplitude: 0.0001,
    endWindow: 10,
  });
  const $depth = computed([$$positionSpring, props.$position], ([posSpring, pos]) => {
    return posSpring / pos;
  });

  ctx.observe(props.$position, (p) => {
    $$positionSpring.animateTo(p);
  });

  ctx.observe($depth, (depth) => {
    ctx.log({ depth });
  });

  return m(
    "li",
    {
      ...props.itemProps,
      style: {
        position: "absolute",
        width: "100%",
        transform: computed([$$positionSpring, props.$position], ([s, p]) => `translateY(${s}px)`),
      },
    },
    props.itemContent(props.$value, props.$index, ctx) as Renderable
  );
}
