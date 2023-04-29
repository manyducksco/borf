import { getCurrentComponent } from "../keys.js";

/**
 * Returns an outlet that displays this component's children when used in a template.
 */
export function useOutlet() {
  const core = getCurrentComponent();
  return core.outlet();
}
