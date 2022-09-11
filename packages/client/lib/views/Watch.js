import { isFunction, isString, isNumber, isTemplate, isObservable } from "../helpers/typeChecking.js";
import { __appContext, __elementContext } from "../keys.js";
import { h } from "../h.js";
import { Text } from "./Text.js";

/**
 * Recreates its contents each time its value changes.
 */
export function Watch() {
  this.name = "woof:template:Watch";

  const appContext = this[__appContext];
  const elementContext = this[__elementContext];

  const node = document.createComment("Watch");
  const render = this.get("render");

  let current;

  this.observe("value", (value) => {
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
