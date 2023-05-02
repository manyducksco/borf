import { getCurrentComponent } from "../keys.js";

/**
 * Displays the child elements of the view that renders it.
 */
export function Outlet(attrs: {}) {
  const core = getCurrentComponent();
  return core.outlet();
}
