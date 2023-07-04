import { omit } from "../core/utils/omit.js";
import { makeMarkup } from "../core/markup/index.js";

export { Fragment } from "../core/views/Fragment.js";

/**
 * JSX function for elements with dynamic children.
 */
export function jsx(element, props, key) {
  return makeMarkup(element, props ? { ...omit(["children", "key"], props) } : undefined, ...[props.children]);
}

/**
 * JSX function for elements with static children.
 */
export function jsxs(element, props, key) {
  return makeMarkup(element, props ? { ...omit(["children", "key"], props) } : undefined, props.children);
}
