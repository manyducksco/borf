import { isComponentInstance, isComponentFactory, isFunction } from "../../helpers/typeChecking.js";
import { makeComponent } from "../../makeComponent.js";

/**
 * Recreates its contents each time its value changes.
 */
export const Watch = makeComponent(($, self) => {
  self.debug.name = "woof:$:watch";

  const node = document.createTextNode("");

  const $value = self.$attrs.map("value");
  const makeItem = self.$attrs.get("makeItem");

  let item;

  function update(value) {
    let newItem = makeItem(value);

    // Support functions that return an element.
    if (newItem && isFunction(newItem) && !isComponentFactory(newItem)) {
      newItem = newItem();
    }

    if (newItem != null && !isComponentInstance(newItem)) {
      throw new TypeError(`Watch: makeItem function should return a component or null. Got: ${newItem}`);
    }

    requestAnimationFrame(() => {
      if (item) {
        item.disconnect();
        item = null;
      }

      if (newItem) {
        item = newItem;
        item.connect(node.parentNode, node);
      }
    });
  }

  self.connected(() => {
    self.watchState($value, update, { immediate: true });
  });

  self.disconnected(() => {
    if (item) {
      item.disconnect();
      item = null;
    }
  });

  return node;
});
