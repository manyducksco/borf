import { omit } from "../core/utils/omit.js";
import { makeMarkup } from "../core/markup.js";

export { Fragment } from "../core/views/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return makeMarkup(element, attributes, ...children);
}
