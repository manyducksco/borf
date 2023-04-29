import { getCurrentComponent } from "../keys.js";

/**
 * Runs `callback` after this component is connected.
 */
export function useConnected(callback: () => any) {
  const core = getCurrentComponent();
  core.onConnected(callback);
}
