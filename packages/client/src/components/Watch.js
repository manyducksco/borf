import { isComponentInstance, isComponent, isFunction } from "../helpers/typeChecking.js";
import { makeComponent } from "../makeComponent.js";

/**
 * Recreates its contents each time its value changes.
 */
export const Watch = makeComponent((_, self) => {
  self.debug.name = "woof:$:watch";

  const node = document.createTextNode("");

  const $value = self.map("value");
  const makeItem = self.get("makeItem");

  let item;

  function update(value) {
    let newItem = makeItem(value);

    // Allow functions that return an element
    if (newItem && isFunction(newItem) && !isComponent(newItem)) {
      newItem = newItem();
    }

    if (newItem != null && !isComponentInstance(newItem)) {
      throw new TypeError(`Watch: makeItem function should return a component or null. Got: ${newItem}`);
    }

    if (item) {
      item.disconnect();
      item = null;
    }

    if (newItem) {
      item = newItem;
      item.connect(node.parentNode, node);
    }
  }

  self.watchState($value, update, { immediate: true });

  self.afterDisconnect(() => {
    if (item) {
      item.disconnect();
      item = null;
    }
  });

  return node;
});
