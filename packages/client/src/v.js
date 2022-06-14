import { isState } from "@woofjs/state";
import { isFunction, isObject, isString, isNumber, isTemplate, isComponent } from "./helpers/typeChecking.js";
import { flatMap } from "./helpers/flatMap.js";
import { initComponent } from "./helpers/initComponent.js";

import { Each } from "./components/Each.js";
import { Text } from "./components/Text.js";
import { Watch } from "./components/Watch.js";
import { Element } from "./components/Element.js";
import { Fragment } from "./components/Fragment.js";

/**
 * Template function. Used in components to render content.
 *
 * @example
 * v("div", { class: "active" }, "Text Content");
 * v("h1", "Text Content");
 * v(Component, { attribute: "value" }, "Child one", "Child two");
 * v(Component, v("h1", "H1 as child of component"));
 *
 * @param element - A tagname or component function.
 * @param args - Optional attributes object and zero or more children.
 */
export function v(element, ...args) {
  let attrs;

  if (isObject(args[0])) {
    attrs = args.shift();
  }

  const view = {
    /**
     * Initialize the view to produce a component instance.
     */
    init(app) {
      // Filter falsy children and convert to component instances.
      const children = flatMap(args)
        .filter((x) => x !== null && x !== undefined && x !== false)
        .map((child) => {
          if (isTemplate(child)) {
            child = child.init(app);
          } else if (isString(child) || isNumber(child) || isState(child)) {
            child = initComponent(app, Text, { value: child });
          }

          if (!isComponent(child)) {
            throw new TypeError(`Children must be components, strings, numbers or states. Got: ${child}`);
          }

          return child;
        });

      if (isString(element)) {
        if (element === "" || element === "<>") {
          return initComponent(app, Fragment, null, children);
        } else {
          return initComponent(app, Element, { tagname: element, attrs }, children);
        }
      } else if (isFunction(element)) {
        return initComponent(app, element, attrs, children);
      } else {
        throw new TypeError(`Expected a tagname or component function. Got: ${element} (${typeof element})`);
      }
    },
  };

  Object.defineProperty(view, "isTemplate", {
    writable: false,
    value: true,
  });

  return view;
}

/**
 * Displays an element when `$condition` is truthy.
 *
 * @example
 * when($value, v("h1", "If you can read this the value is truthy."))
 *
 * @param $condition - State or variable with a truthy or falsy value.
 * @param element - Element to display when $condition is truthy.
 */
export function when($condition, element) {
  return v(Watch, {
    value: $condition,
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
 * Displays an element when `$condition` is falsy.
 *
 * @example
 * unless($value, v("h1", "If you can read this the value is falsy."))
 *
 * @param $condition - State or variable with a truthy or falsy value.
 * @param element - Element to display when $condition is falsy.
 */
export function unless($condition, element) {
  return v(Watch, {
    value: $condition,
    render: (value) => {
      if (value) {
        return null;
      } else {
        return element;
      }
    },
  });
}

let id = 0;

/**
 * Displays a component once for each item in `$values`.
 *
 * @param $values - An array or state containing an array.
 * @param component - Component to display for each item.
 */
export function each($values, component) {
  return v(Each, { value: $values, component });
}

/**
 * Displays the result of the `render` function whenever `$value` changes.
 *
 * @param $value - A state containing a value to watch.
 * @param render - Function that takes the latest value and returns an element to display.
 */
export function watch($value, render) {
  return v(Watch, { value: $value, render });
}

/**
 * Creates a two-way binding on a state. When used as the value of an `<input>`
 * element, the input's value will propagate back to `$value` whenever it changes.
 *
 * @example
 * <input type="text" value={bind($value)} />
 *
 * @param $value - A state to two-way bind.
 * @param event - The event that triggers an update to `$value`. Defaults to "input".
 */
export function bind($value, event = "input") {
  const binding = { $value, event };

  Object.defineProperty(binding, "isBinding", {
    writable: false,
    value: true,
  });

  return binding;
}
