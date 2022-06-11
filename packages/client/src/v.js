import { isFunction, isObject, isString } from "./helpers/typeChecking";

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
  // TODO: Everything.

  let attrs;
  let children;

  if (isObject(args[0])) {
    attrs = args.shift();
  }

  children = args;

  if (isString(element)) {
    // Treat as HTML tag name
  } else if (isFunction(element)) {
    // Treat as component function
  } else {
    throw new TypeError(`Expected a tagname or component function. Got: ${typeof element} ${element}`);
  }

  return {};
}

export function when($condition, element) {}

export function unless($condition, element) {}

export function each($values, component) {}

export function watch($value, render) {}

export function bind($value) {}
