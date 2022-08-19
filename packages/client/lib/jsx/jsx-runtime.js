import { omit } from "../helpers/omit.js";
import { Template } from "../h.js";

export { Fragment } from "../components/Fragment.js";

/**
 * JSX function for elements with dynamic children.
 */
export function jsx(element, props, key) {
  return new Template(element, { ...omit(["children"], props), key }, [props.children]);
}

/**
 * JSX function for elements with static children.
 */
export function jsxs(element, props, key) {
  return new Template(element, { ...omit(["children"], props), key }, props.children);
}
