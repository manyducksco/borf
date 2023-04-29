import { getCurrentComponent } from "../keys.js";

/**
 * Sets the name of this component.
 */
export function useName(name: string) {
  const core = getCurrentComponent();
  core.setName(name);
}
