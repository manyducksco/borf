import { _useElementContext } from "./_useElementContext.js";

/**
 * Returns the children of the current component.
 */
export function _useChildren() {
  const elementContext = _useElementContext();
  return elementContext.$$children;
}
