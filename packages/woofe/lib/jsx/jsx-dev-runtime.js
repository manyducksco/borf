import { omit } from "../helpers/omit.js";
import { m } from "../classes/Markup.js";

export { Fragment } from "../classes/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return m(element, attributes, ...children);
}
