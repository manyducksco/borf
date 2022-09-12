import { isBinding, isString } from "../helpers/typeChecking";

import { Template } from "../h.js";
import { Watch } from "../views/Watch.js";
import { Repeat } from "../views/Repeat.js";

export function makeViewHelpers(state) {
  function bound(value) {
    if (isBinding(value)) {
      return value;
    }

    if (isString(value)) {
      return state.readable(value);
    }

    return value;
  }

  /**
   * Displays an element when `value` is truthy.
   *
   * @example
   * when($value, h("h1", "If you can read this the value is truthy."))
   *
   * @param value - Binding or variable name.
   * @param element - Element to display.
   */
  function when(value, element) {
    return new Template(Watch, {
      value: bound(value),
      render: (value) => {
        if (value) {
          return element;
        } else {
          return null;
        }
      },
    });
  }

  /**
   * Displays an element when `value` is falsy.
   *
   * @example
   * unless($value, h("h1", "If you can read this the value is falsy."))
   *
   * @param value - Binding or variable name.
   * @param element - Element to display.
   */
  function unless(value, element) {
    return new Template(Watch, {
      value: bound(value),
      render: (value) => {
        if (value) {
          return null;
        } else {
          return element;
        }
      },
    });
  }

  /**
   * Repeats a component once for each item in `$values`.
   *
   * @param value - Binding or variable name containing an array.
   * @param view - View to repeat for each item.
   * @param getKey - Takes an array item and returns a unique key. If not provided then the array item identity will be used.
   */
  function repeat(value, view, getKey = null) {
    return new Template(Repeat, { value: bound(value), view, getKey });
  }

  /**
   * Displays the result of the `render` function whenever `$value` changes.
   *
   * @param value - Binding or variable name to watch.
   * @param render - Function that takes the latest value and returns an element to display.
   */
  function watch(value, render) {
    return new Template(Watch, { value: bound(value), render });
  }

  return { when, unless, repeat, watch };
}
