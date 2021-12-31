import { makeState } from "../state/makeState";
import { isState } from "../../_helpers/typeChecking";
import { deepEqual } from "../../_helpers/deepEqual";
import { $Node } from "./$Node";
import { makeRender } from "./makeRender";

/**
 * Transform a list of items into a list of `$(element)`s.
 *
 * Removes old and adds new items without touching existing ones.
 * Re-renders existing items if the previous item with the same key is not equal to the new one.
 */
export class $Map extends $Node {
  source;
  getKey;
  createItem;
  unwatch;
  list = [];

  constructor(source, getKey, createItem) {
    super();
    this.source = isState(source) ? source : makeState(source);
    this.getKey = getKey;
    this.createItem = createItem;
  }

  update(list) {
    if (!this.$isConnected) {
      return;
    }

    const newKeys = list.map(this.getKey);
    const added = [];
    const removed = [];
    const moved = [];

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const current = this.list.find((item) => item.key === key);

      if (current) {
        if (current.index !== i) {
          moved.push({
            from: current.index,
            to: i,
            key,
          });
        }
      } else {
        added.push({ i, key });
      }
    }

    for (const item of this.list) {
      const stillPresent = newKeys.includes(item.key);

      if (!stillPresent) {
        removed.push({ i: item.index, key: item.key });
      }
    }

    // Determine what the next state is going to be, reusing components when possible.
    const newItems = [];

    for (let i = 0; i < list.length; i++) {
      const key = newKeys[i];
      const value = list[i];
      const isAdded = added.some((x) => x.key === key);

      let node;

      if (isAdded) {
        node = makeRender(this.createItem(value))();
      } else {
        const item = this.list.find((x) => x.key === key);

        if (deepEqual(item.value, value)) {
          node = item.node;
        } else {
          node = this.createItem(value);
        }
      }

      newItems.push({
        index: i,
        key,
        value,
        node,
      });
    }

    // Batch all changes into an animation frame
    requestAnimationFrame(() => {
      // Unmount removed items
      for (const entry of removed) {
        const item = this.list.find((x) => x.key === entry.key);

        item?.node.$disconnect();
      }

      if (!this.$isConnected) {
        return;
      }

      const fragment = new DocumentFragment();

      // Remount items in new order
      let previous = undefined;

      for (const item of newItems) {
        item.node.$connect(fragment, previous);

        if (item.node.$isConnected) {
          previous = item.node.$element;
          item.node.$element.dataset.mapKey = item.key;
        }
      }

      this.$element.parentNode.insertBefore(
        fragment,
        this.$element.nextSibling
      );

      this.list = newItems;
    });
  }

  _connected() {
    if (this.unwatch) {
      this.unwatch();
      this.unwatch = undefined;
    }

    this.unwatch = this.source.watch(this.update.bind(this));

    this.update(this.source.get());
  }

  _disconnected() {
    for (const item of this.list) {
      item.node.$disconnect();
    }

    if (this.unwatch) {
      this.unwatch();
      this.unwatch = undefined;
    }
  }
}
