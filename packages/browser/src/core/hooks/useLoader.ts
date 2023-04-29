import { type Markup } from "../classes/Markup.js";
import { getCurrentComponent } from "../keys.js";

/**
 * Sets loading content to be displayed while this component's setup is pending.
 * Only takes effect if this component function is async.
 */
export function useLoader(loader: Markup) {
  const core = getCurrentComponent();
  core.setLoader(loader);
}
