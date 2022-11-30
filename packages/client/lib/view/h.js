import { isArray, isFunction, isObject, isString } from "../helpers/typeChecking.js";

import { ElementBlueprint } from "./blueprints/Element.js";
import { ViewBlueprint } from "./blueprints/View.js";

import { Fragment } from "./Fragment.js";
import { OutletBlueprint } from "./blueprints/Outlet.js";
import { RepeatBlueprint } from "./blueprints/Repeat.js";

/**
 * Template function. Used in views to render content.
 *
 * @example
 * h("div", { class: "active" }, "Text Content");
 * h("h1", "Text Content");
 * h(View, { attribute: "value" }, "Child one", "Child two");
 * h(View, v("h1", "H1 as child of component"));
 *
 * @param element - A tag name or view function.
 * @param args - Optional attributes object and zero or more children.
 */
export function h(element, ...args) {
  let attributes = {};
  let children = args;

  if (isObject(children[0])) {
    attributes = children.shift();
  }

  if (isString(element)) {
    if (element === "<>") {
      return new ViewBlueprint(Fragment, null, children);
    } else {
      return new ElementBlueprint(element, attributes, children);
    }
  } else if (isFunction(element)) {
    return new ViewBlueprint(element, attributes, children);
  } else {
    throw new TypeError(`h() accepts either a tag name or a view as the first argument. Got: ${element}`);
  }
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
 * @param $value - Binding to observe.
 * @param element - Element to display when value is truthy.
 * @param otherwise - Alternate element to display when value is falsy.
 */
h.when = function when($value, element, otherwise) {
  return new OutletBlueprint($value, (value) => {
    if (value) {
      return element;
    }

    if (otherwise) {
      return otherwise;
    }

    return null;
  });
};

/**
 * Displays an element when `value` is falsy.
 *
 * @example
 * ctx.unless($value, h("h1", "If you can read this the value is falsy."))
 *
 * @param $value - Binding to observe.
 * @param element - Element to display.
 */
h.unless = function unless($value, element) {
  return new OutletBlueprint($value, (value) => {
    if (value) {
      return element;
    }

    return null;
  });
};

/**
 * Matches a value against a set of cases, returning the matching result.
 *
 * @example
 * ctx.match($value, [
 *   ["value1", <ThisView />],
 *   ["value2", <ThatView />],
 *   ["value3", <AnotherView />],
 *   <FallbackView />
 * ]);
 *
 * @param $value - Binding to observe.
 * @param cases - Array of cases with an optional fallback as a final element.
 */
h.match = function match($value, cases) {
  if (!isArray(cases)) {
    throw new TypeError(`Expected an array of [value, result] cases as the second argument. Got: ${typeof cases}`);
  }

  const fallback = !isArray(cases[cases.length - 1]) ? cases.pop() : null;

  return new OutletBlueprint($value, (value) => {
    for (const [cond, result] of cases) {
      let matches = false;

      if (isFunction(cond) && cond(value)) {
        matches = true;
      } else if (cond === value) {
        matches = true;
      }

      if (matches) {
        if (isFunction(result)) {
          return result(value);
        }

        return result;
      }
    }

    if (fallback) {
      if (isFunction(fallback)) {
        return fallback(value);
      }

      return fallback;
    }

    return null;
  });
};

/**
 * Repeats a component once for each item in `$values`.
 *
 * @param $value - Binding containing an array.
 * @param renderFn - Function to repeat for each item. Takes $value and $index bindings and returns an element to render.
 * @param keyFn - Takes an item and returns a unique key. If not provided then the item identity (===) will be used.
 */
h.repeat = function repeat($value, renderFn, keyFn = null) {
  return new RepeatBlueprint($value, renderFn, keyFn);
};
