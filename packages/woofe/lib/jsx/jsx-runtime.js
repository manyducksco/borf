import { omit } from "../helpers/omit.js";
import { m } from "../helpers/markup.js";

export { FragmentBlueprint as Fragment } from "../blueprints/Fragment.js";

/**
 * JSX function for elements with dynamic children.
 */
export function jsx(element, props, key) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = [props.children];

  return m(element, attributes, ...children);
}

/**
 * JSX function for elements with static children.
 */
export function jsxs(element, props, key) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = props.children;

  return m(element, attributes, ...children);
}
