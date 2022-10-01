import { isString } from "./typeChecking.js";

import { Template } from "../h.js";
import { Repeater } from "../views/Repeater.js";

import { Outlet } from "./Outlet.js";

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
   * @param value - Binding or variable name.
   * @param element - Element to display.
   */
  function when(value, element) {
    return new Outlet(bound(value), (value) => {
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
    return new Outlet(bound(value), (value) => {
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
   * @param callback - Function to repeat for each item. Takes $value and $index bindings and returns an element to render.
   * @param getKey - Takes an item and returns a unique key. If not provided then the item identity (===) will be used.
   */
  function repeat(value, callback, getKey = null) {
    return new Template(Repeater, { value: bound(value), render: callback, getKey });
  }

  /**
   * Converts an element stored in `value` into a DOM node. Optionally with the help of a `callback` function.
   *
   * @param value - Binding or variable name to watch.
   * @param callback - Function to transform `value` into a renderable element. Runs each time `value` changes.
   */
  function outlet(value = "children", callback = null) {
    return new Outlet(bound(value), callback);
  }

  return { when, unless, repeat, outlet };
}
