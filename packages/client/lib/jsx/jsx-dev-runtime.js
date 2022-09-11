import { omit } from "../helpers/omit.js";
import { Template } from "../h.js";

export { Fragment } from "../views/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const children = Array.isArray(props.children) ? props.children : [props.children];
  return new Template(element, { ...omit(["children"], props), key }, children);
}
