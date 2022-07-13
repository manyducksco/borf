import { isFunction, isTemplate } from "../helpers/typeChecking.js";

import { appContextKey, elementContextKey } from "../helpers/initComponent.js";

/**
 * Recreates its contents each time its value changes.
 */
export function Watch() {
  const appContext = this[appContextKey];
  const elementContext = this[elementContextKey];

  this.debug.name = "woof:template:watch";

  const node = document.createTextNode("");

  const $value = this.$attrs.map("value");
  const render = this.$attrs.get("render");

  let current;

  function update(value) {
    let newItem = render(value);

    // Allow functions that return an element
    if (newItem && isFunction(newItem)) {
      newItem = newItem();
    }

    if (newItem != null && !isTemplate(newItem)) {
      throw new TypeError(`Watch: render function should return a view or null. Got: ${newItem}`);
    }

    if (current) {
      current.disconnect();
      current = null;
    }

    if (newItem) {
      current = newItem.init(appContext, elementContext);
      current.connect(node.parentNode, node);
    }
  }

  this.watchState($value, update);

  this.afterDisconnect(() => {
    if (current) {
      current.disconnect();
      current = null;
    }
  });

  return node;
}
