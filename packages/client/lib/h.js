import {
  isFunction,
  isObject,
  isString,
  isNumber,
  isTemplate,
  isComponent,
  isObservable,
} from "./helpers/typeChecking.js";
import { flatten } from "./helpers/flatten.js";
import { initComponent } from "./helpers/initComponent.js";

import { Text } from "./components/Text.js";
import { Watch } from "./components/Watch.js";
import { Repeat } from "./components/Repeat.js";
import { Element } from "./components/Element.js";
import { Fragment } from "./components/Fragment.js";

// import { makeComponent } from "./makeComponent.js";

/**
 * Template function. Used in components to render content.
 *
 * @example
 * h("div", { class: "active" }, "Text Content");
 * h("h1", "Text Content");
 * h(Component, { attribute: "value" }, "Child one", "Child two");
 * h(Component, v("h1", "H1 as child of component"));
 *
 * @param element - A tagname or component function.
 * @param args - Optional attributes object and zero or more children.
 */
export function h(element, ...args) {
  let attrs = {};

  if (isObject(args[0])) {
    attrs = args.shift();
  }

  return new Template(element, attrs, args);
}

export class Template {
  constructor(element, attrs, children) {
    this.element = element;
    this.attrs = attrs || {};
    this.children = children || [];
  }

  get isTemplate() {
    return true;
  }

  init(appContext, elementContext = {}) {
    elementContext = {
      ...elementContext,
    };

    // Mark this element and children as SVG. HTML and SVG require different functions
    // to create their nodes, and the Element component uses this to choose the correct one.
    if (!elementContext.isSVG && this.element === "svg") {
      elementContext.isSVG = true;
    }

    // Filter falsy children and convert to component instances.
    const children = flatten(this.children)
      .filter((x) => x !== null && x !== undefined && x !== false)
      .map((child) => {
        if (isTemplate(child)) {
          child = child.init(appContext, elementContext);
        } else if (isString(child) || isNumber(child) || isObservable(child)) {
          child = initComponent(appContext, Text, { value: child });
        }

        if (!isComponent(child)) {
          throw new TypeError(`Children must be components, strings, numbers or observables. Got: ${child}`);
        }

        return child;
      });

    let { element, attrs } = this;

    if (isString(element)) {
      if (element === "" || element === "<>") {
        return initComponent(appContext, Fragment, null, children, elementContext);
      } else {
        return initComponent(appContext, Element, { tagname: element, attrs }, children, elementContext);
      }
    } else if (isFunction(element)) {
      return initComponent(appContext, element, attrs, children, elementContext);
    } else {
      console.error("Element", element);
      throw new TypeError(`Expected a tagname or component function. Got ${typeof element}`);
    }
  }
}

/**
 * Displays an element when `$condition` is truthy.
 *
 * @example
 * when($value, h("h1", "If you can read this the value is truthy."))
 *
 * @param $condition - State or variable with a truthy or falsy value.
 * @param element - Element to display when $condition is truthy.
 */
export function when($condition, element) {
  return h(Watch, {
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
 * unless($value, h("h1", "If you can read this the value is falsy."))
 *
 * @param $condition - State or variable with a truthy or falsy value.
 * @param element - Element to display when $condition is falsy.
 */
export function unless($condition, element) {
  return h(Watch, {
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

/**
 * Repeats a component once for each item in `$values`.
 *
 * @param $values - An array or state containing an array.
 * @param component - Component to repeat for each item.
 * @param getKey - Takes an array item and returns a unique key. If not provided then the array index will be used.
 */
export function repeat($values, component, getKey = null) {
  return h(Repeat, { value: $values, component, getKey });
}

/**
 * Displays the result of the `render` function whenever `$value` changes.
 *
 * @param $value - A state containing a value to watch.
 * @param render - Function that takes the latest value and returns an element to display.
 */
export function watch($value, render) {
  return h(Watch, { value: $value, render });
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
  return {
    $value,
    event,
    isBinding: true,
  };
}
