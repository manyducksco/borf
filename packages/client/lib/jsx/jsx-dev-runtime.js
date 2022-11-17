import { omit } from "../helpers/omit.js";
import { h } from "../view/h.js";

export { Fragment } from "../view/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children"], props), key };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return h(element, attributes, children);
}
