import { isFunction, isString, isNumber, isTemplate, isObservable } from "../helpers/typeChecking.js";
import { $$appContext, $$elementContext } from "../keys.js";
import { h } from "../h.js";
import { Text } from "./Text.js";

/**
 * Recreates its contents each time its value changes.
 */
export function Watch() {
  const appContext = this[$$appContext];
  const elementContext = this[$$elementContext];

  this.debug.name = "woof:template:watch";

  const node = document.createComment("watch");

  const $value = this.$attrs.map((a) => a.value);
  const render = this.$attrs.get((a) => a.render);

  let current;

  this.subscribeTo($value, (value) => {
    let newItem = render(value);

    // Allow functions that return an element
    if (newItem && isFunction(newItem)) {
      newItem = newItem();
    }

    if (newItem != null) {
      if (isString(newItem) || isNumber(newItem) || isObservable(newItem)) {
        newItem = h(Text, { value: newItem });
      }

      if (!isTemplate(newItem)) {
        throw new TypeError(`Watch: render function should return an element, string or null. Got: ${newItem}`);
      }
    }

    if (current) {
      current.disconnect({ allowTransitionOut: true });
      current = null;
    }

    if (newItem) {
      current = newItem.init({ appContext, elementContext });
      current.connect(node.parentNode, node);
    }
  });

  this.afterDisconnect(() => {
    if (current) {
      current.disconnect({ allowTransitionOut: true });
      current = null;
    }
  });

  return node;
}
