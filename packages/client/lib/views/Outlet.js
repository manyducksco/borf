import { isTemplate, isFunction, isString, isNumber, isObservable, isArray } from "../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { Template } from "../h.js";
import { makeView } from "../makers/makeView.js";
import { Fragment } from "./Fragment.js";

/**
 * Expresses a value in state as DOM nodes.
 */
export const Outlet = makeView((ctx) => {
  ctx.name = "Outlet";
  const node = document.createComment("Outlet");

  const appContext = ctx[APP_CONTEXT];
  const elementContext = ctx[ELEMENT_CONTEXT];

  const render = ctx.get("render");

  let current = null;

  ctx.observe("value", (value) => {
    let newItem = render ? render(value) : value;

    // Allow functions that return an element
    if (newItem && isFunction(newItem)) {
      newItem = newItem();
    }

    if (isArray(newItem)) {
      newItem = new Template(Fragment, null, newItem);
    }

    if (newItem != null) {
      if (isString(newItem) || isNumber(newItem) || isObservable(newItem)) {
        newItem = new Template(Text, { value: newItem });
      }

      if (!isTemplate(newItem) && !newItem.isView) {
        throw new TypeError(`Outlet: value must be an element, string or null. Got: ${newItem}`);
      }
    }

    if (current) {
      current.disconnect();
      current = null;
    }

    if (newItem) {
      if (newItem.isView) {
        current = newItem;
      } else {
        current = newItem.init({ appContext, elementContext });
      }

      current.connect(node.parentNode, node);
    }
  });

  ctx.afterDisconnect(() => {
    if (current) {
      current.disconnect();
      current = null;
    }
  });

  return node;
});
