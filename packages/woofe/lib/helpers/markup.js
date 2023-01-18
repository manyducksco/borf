import { isFunction, isObject, isString, isBlueprint } from "./typeChecking.js";

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
  let attributes = {};
  let children = args;

  if (isObject(children[0])) {
    attributes = children.shift();
  }

  if (isBlueprint(element)) {
    element.defaultAttributes = attributes;
    element.defaultChildren = children;
    return element;
  } else if (isString(element)) {
    if (element === "<>") {
      return new ObserverBlueprint(children);
    }
    return new ElementBlueprint(element, attributes, children);
  } else if (isFunction(element)) {
    return new ViewBlueprint({ setup: element, defaultAttributes: attributes, defaultChildren: children });
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
 * Repeats a component once for each item in `$values`.
 *
 * @param $value - Binding containing an array.
 * @param renderFn - Function to repeat for each item. Takes $value and $index bindings and returns an element to render.
 * @param keyFn - Takes an item and returns a unique key. If not provided then the item identity (===) will be used.
 */
m.repeat = function repeat($value, renderFn, keyFn = null) {
  return new RepeatBlueprint($value, renderFn, keyFn);
};
