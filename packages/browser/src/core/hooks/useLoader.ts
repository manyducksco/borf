import { getCurrentContext } from "../component.js";
import { type Markup } from "../classes/Markup.js";

/**
 * Sets loading content to be displayed while this component's setup is pending.
 * Only takes effect if this component function is async.
 */
export function useLoader(content: Markup) {
  const ctx = getCurrentContext();
  ctx.loadingContent = content;
}
