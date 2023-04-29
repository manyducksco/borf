import { getCurrentComponent } from "../keys.js";

/**
 * Returns a replacement for the global `console` object that prints messages tagged with the component's name.
 */
export function useConsole() {
  const core = getCurrentComponent();
  return core.debug;
}
