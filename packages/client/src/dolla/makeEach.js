import { makeState, isState } from "@woofjs/state";
import { deepEqual } from "../helpers/deepEqual.js";
import { makeRenderable } from "./makeRenderable.js";
import { makeNode } from "./makeNode.js";

export const makeEach = makeNode((self, $state, makeKey, makeItem) => {
  if (!isState($state)) {
    $state = makeState($state);
  }

  let items = [];
  let unwatch;

  function update(newItems) {
    if (!self.isConnected) {
      return;
    }

    if (newItems == null) {
      for (const item of items) {
        item.node.disconnect();
      }

      items = [];

      return;
    }

    const added = [];
    const removed = [];
    const moved = [];

    const newKeys = newItems.map(makeKey);

    for (let i = 0; i < newKeys.length; i++) {
      const key = newKeys[i];
      const current = items.find((item) => item.key === key);

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

    for (const item of items) {
      const stillPresent = newKeys.includes(item.key);

      if (!stillPresent) {
        removed.push({ i: item.index, key: item.key });
      }
    }

    // Determine what the next state is going to be, reusing components when possible.
    const nextItems = [];

    for (let i = 0; i < newItems.length; i++) {
      const key = newKeys[i];
      const value = newItems[i];
      const isAdded = added.some((x) => x.key === key);

      let node;

      if (isAdded) {
        node = makeRenderable(makeItem(value))();
      } else {
        const item = items.find((x) => x.key === key);

        if (deepEqual(item.value, value)) {
          node = item.node;
        } else {
          node = makeRenderable(makeItem(value))();
          removed.push({ i: item.index, key: item.key });
        }
      }

      nextItems.push({
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
        const item = items.find((x) => x.key === entry.key);

        item?.node.disconnect();
      }

      if (!self.isConnected) {
        return;
      }

      const fragment = new DocumentFragment();

      // Remount items in new order
      let previous = undefined;

      for (const item of nextItems) {
        item.node.connect(fragment, previous);

        if (item.node.isConnected) {
          previous = item.node.element;
          item.node.element.dataset.mapKey = item.key;
        }
      }

      self.element.parentNode.insertBefore(fragment, self.element.nextSibling);

      items = nextItems;
    });
  }

  self.connected(() => {
    if (unwatch) {
      unwatch();
      unwatch = undefined;
    }

    unwatch = $state.watch(update, { immediate: true });
  });

  self.disconnected(() => {
    for (const item of items) {
      item.node.disconnect();
    }

    if (unwatch) {
      unwatch();
      unwatch = undefined;
    }
  });

  return document.createTextNode("");
});
