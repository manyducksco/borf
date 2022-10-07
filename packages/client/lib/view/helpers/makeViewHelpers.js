import { isArray, isString } from "../../helpers/typeChecking.js";

import { OutletBlueprint } from "../blueprints/Outlet.js";
import { RepeatBlueprint } from "../blueprints/Repeat.js";

export function makeViewHelpers(state) {
  function bound(value) {
    if (isString(value)) {
      return state.readable(value);
    }

    return value;
  }

  /**
   * Displays an element when `value` is truthy.
   *
   * @example
   * ctx.when($value, h("h1", "If you can read this the value is truthy."))
   *
   * // Switch-style case array.
   * ctx.when($value, [
   *   ["value1", <ThisView />],
   *   ["value2", <ThatView />],
   *   ["value3", <AnotherView />],
   *   <FallbackView />
   * ])
   *
   * @param value - Binding or variable name.
   * @param element - Element to display or 2D switch-style case array.
   */
  function when(value, element) {
    if (isArray(element)) {
      const fallback = !isArray(element[element.length - 1]) ? element.pop() : null;

      return new OutletBlueprint(bound(value), (value) => {
        for (const entry of element) {
          if (entry[0] === value) {
            return entry[1];
          }
        }

        if (fallback) {
          return fallback;
        }

        return null;
      });
    }

    return new OutletBlueprint(bound(value), (value) => {
      if (value) {
        return element;
      }

      return null;
    });
  }

  /**
   * Displays an element when `value` is falsy.
   *
   * @example
   * ctx.unless($value, h("h1", "If you can read this the value is falsy."))
   *
   * @param value - Binding or variable name.
   * @param element - Element to display.
   */
  function unless(value, element) {
    return new OutletBlueprint(bound(value), (value) => {
      if (!value) {
        return element;
      }

      return null;
    });
  }

  /**
   * Repeats a component once for each item in `$values`.
   *
   * @param value - Binding or variable name containing an array.
   * @param renderFn - Function to repeat for each item. Takes $value and $index bindings and returns an element to render.
   * @param keyFn - Takes an item and returns a unique key. If not provided then the item identity (===) will be used.
   */
  function repeat(value, renderFn, keyFn = null) {
    return new RepeatBlueprint(bound(value), renderFn, keyFn);
  }

  /**
   * Converts an element stored in `value` into a DOM node. Optionally with the help of a `callback` function.
   *
   * @param value - Binding or variable name to watch.
   * @param callback - Function to transform `value` into a renderable element. Runs each time `value` changes.
   */
  function outlet(value = "children", callback = null) {
    return new OutletBlueprint(bound(value), callback);
  }

  return { when, unless, repeat, outlet };
}
