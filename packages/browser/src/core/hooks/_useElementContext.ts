import { type ElementContext } from "../classes/App.js";
import { ELEMENT_CONTEXT, getCurrentComponent } from "../keys.js";

/**
 * Returns the element context. This hook is for internal use and should not be exported.
 */
export function _useElementContext(): ElementContext {
  const core = getCurrentComponent();
  return (core as any)[ELEMENT_CONTEXT];
}
