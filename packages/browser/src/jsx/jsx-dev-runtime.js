import { omit } from "../core/helpers/omit.js";
import { m } from "../core/classes/Markup_temp.js";

export { Fragment } from "../core/classes/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return m(element, attributes, ...children);
}
