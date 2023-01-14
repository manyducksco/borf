import { isArray, isFunction, isObject, isString, isBlueprint } from "./typeChecking.js";

import { ElementBlueprint } from "../blueprints/Element.js";
import { ViewBlueprint } from "../blueprints/View.js";
import { ObserverBlueprint } from "../blueprints/Observer.js";
import { RepeatBlueprint } from "../blueprints/Repeat.js";
import { joinStates } from "../makeState.js";

/**
 * Markup function. Used in views to render HTML elements.
 *
 * @example
 * m("div", { class: "active" }, "Text Content");
 * m("h1", "Text Content");
 * m(View, { attribute: "value" }, "Child one", "Child two");
 * m(View, v("h1", "H1 as child of component"));
 *
 * @param element - A tag name or view function.
 * @param args - Optional attributes object and zero or more children.
 */
export function m(element, ...args) {
  if (isBlueprint(element)) {
    return element;
  }

  let attributes = {};
  let children = args;

  if (isObject(children[0])) {
    attributes = children.shift();
  }

  if (isString(element)) {
    if (element === "<>") {
      return new ObserverBlueprint(children);
    } else {
      return new ElementBlueprint(element, attributes, children);
    }
  } else if (isFunction(element)) {
    return new ViewBlueprint(element, attributes, children);
  } else {
    console.warn(element);
    throw new TypeError(`m() accepts either a tag name or a view as the first argument. Got: ${element}`);
  }
}

/**
 * Displays an element when `value` is truthy.
 *
 * @example
 * m.when($value, h("h1", "If you can read this the value is truthy."))
 *
 * @param $value - Binding to observe.
 * @param element - Element to display when value is truthy.
 * @param otherwise - (Optional) alternate element to display when value is falsy.
 */
m.when = function when($value, element, otherwise) {
  return new ObserverBlueprint($value, (value) => {
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
 * m.unless($value, h("h1", "If you can read this the value is falsy."))
 *
 * @param $value - Binding to observe.
 * @param element - Element to display.
 */
m.unless = function unless($value, element) {
  return new ObserverBlueprint($value, (value) => {
    if (!value) {
      return element;
    }

    return null;
  });
};

/**
 * Renders a dynamic DOM chunk that changes with one or more states.
 *
 * @example
 * h.observe($state1, $state2, (value1, value2) => {
 *   if (value1) {
 *     return <ThisView />;
 *   }
 *
 *   if (value2) {
 *     return <ThatView />;
 *   }
 *
 *   return <FallbackView />
 * });
 *
 * @param args - One or more observables followed by a render function that takes their values.
 */
m.observe = function observe(...args) {
  const render = args.pop();

  if (!isFunction(render)) {
    throw new TypeError("Expected a function as the last argument. Got: " + render);
  }

  return new ObserverBlueprint(joinStates(...args, render));
};

/**
 * Matches a value against a set of cases, returning the matching result.
 *
 * @example
 * h.match($value, [
 *   ["value1", <ThisView />],
 *   ["value2", <ThatView />],
 *   ["value3", <AnotherView />],
 *   <FallbackView />
 * ]);
 *
 * @param $value - Binding to observe.
 * @param cases - Array of cases with an optional fallback as a final element.
 */
m.match = function match($value, cases) {
  if (!isArray(cases)) {
    throw new TypeError(`Expected an array of [value, result] cases as the second argument. Got: ${typeof cases}`);
  }

  const fallback = !isArray(cases[cases.length - 1]) ? cases.pop() : null;

  return new ObserverBlueprint($value, (value) => {
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
m.repeat = function repeat($value, renderFn, keyFn = null) {
  return new RepeatBlueprint($value, renderFn, keyFn);
};
