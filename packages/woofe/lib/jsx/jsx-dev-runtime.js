import { omit } from "../helpers/omit.js";
// import { m } from "../helpers/markup.js";
import { m } from "../_experimental/Markup.js";

export { FragmentBlueprint as Fragment } from "../blueprints/Fragment.js";

export function jsxDEV(element, props, key, isStaticChildren, source, self) {
  const attributes = { ...omit(["children", "key"], props) };
  const children = Array.isArray(props.children) ? props.children : [props.children];

  return m(element, attributes, ...children);
}
