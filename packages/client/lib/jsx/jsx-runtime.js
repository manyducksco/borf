import { omit } from "../helpers/omit.js";
import { h } from "../view/h.js";

export { Fragment } from "../view/Fragment.js";

/**
 * JSX function for elements with dynamic children.
 */
export function jsx(element, props, key) {
  const attributes = { ...omit(["children", "key"], props), key };
  const children = [props.children];

  return h(element, attributes, children);
}

/**
 * JSX function for elements with static children.
 */
export function jsxs(element, props, key) {
  const attributes = { ...omit(["children", "key"], props), key };
  const children = props.children;

  return h(element, attributes, children);
}
