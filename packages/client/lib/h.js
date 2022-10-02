import { isFunction, isObject, isString } from "./helpers/typeChecking.js";

import { ElementBlueprint } from "./view/blueprints/Element.js";
import { ViewBlueprint } from "./view/blueprints/View.js";

import { Fragment } from "./view/Fragment.js";

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
