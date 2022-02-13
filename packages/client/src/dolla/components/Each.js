import { deepEqual } from "../../helpers/deepEqual.js";
import { isComponentInstance, isComponentFactory, isFunction } from "../../helpers/typeChecking.js";
import { makeComponent } from "../../makeComponent.js";

export const Each = makeComponent(($, self) => {
  self.debug.name = "woof:$.each";

  const $value = self.$attrs.map("value");
  const makeKey = self.$attrs.get("makeKey");
  const makeItem = self.$attrs.get("makeItem");

  const node = document.createTextNode("");

  let items = [];

  function update(newItems) {
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

      let newItem;

      if (isAdded) {
        newItem = makeItem(value);
      } else {
        const item = items.find((x) => x.key === key);

        if (deepEqual(item.value, value)) {
          newItem = item.node;
        } else {
          newItem = makeItem(value);

          removed.push({ i: item.index, key: item.key });
        }
      }

      // Support functions that return an element.
      if (newItem && isFunction(newItem) && !isComponentFactory(newItem)) {
        newItem = newItem();
      }

      if (newItem != null && !isComponentInstance(newItem)) {
        throw new TypeError(`Each: makeItem function should return a component or null. Got: ${newItem}`);
      }

      nextItems.push({
        index: i,
        key,
        value,
        node: newItem,
      });
    }

    // Batch all changes into an animation frame
    requestAnimationFrame(async () => {
      // Unmount removed items
      for (const entry of removed) {
        const item = items.find((x) => x.key === entry.key);

        item?.node.disconnect();
      }

      const fragment = new DocumentFragment();

      // Remount items in new order
      let previous = undefined;

      for (const item of nextItems) {
        await item.node.connect(fragment, previous);

        if (item.node.isConnected) {
          previous = item.node.element;
          item.node.element.dataset.eachKey = item.key;
        }
      }

      node.parentNode.insertBefore(fragment, node.nextSibling || null);

      items = nextItems;
    });
  }

  self.connected(() => {
    self.watchState($value, update, { immediate: true });
  });

  self.disconnected(() => {
    for (const item of items) {
      item.node.disconnect();
    }
  });

  return node;
});
