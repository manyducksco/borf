import { omit } from "../core/utils/omit.js";
import { m } from "../core/helpers/html.js";

export { Fragment } from "../core/views/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return m(element, attributes, ...children);
}
