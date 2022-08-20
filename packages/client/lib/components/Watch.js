import { isFunction, isString, isNumber, isTemplate, isObservable } from "../helpers/typeChecking.js";
import { $$appContext, $$elementContext } from "../keys.js";
import { h } from "../h.js";
import { Text } from "./Text.js";
import { makeComponent } from "../makeComponent.js";

/**
 * Recreates its contents each time its value changes.
 */
export const Watch = makeComponent((ctx) => {
  const appContext = ctx[$$appContext];
  const elementContext = ctx[$$elementContext];

  ctx.debug.name = "woof:template:watch";

  const node = document.createComment("watch");

  const $value = ctx.$attrs.map("value");
  const render = ctx.$attrs.get("render");

  let current;

  ctx.subscribeTo($value, (value) => {
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
      current = newItem.init(appContext, elementContext);
      current.connect(node.parentNode, node);
    }
  });

  ctx.afterDisconnect(() => {
    if (current) {
      current.disconnect({ allowTransitionOut: true });
      current = null;
    }
  });

  return node;
});
