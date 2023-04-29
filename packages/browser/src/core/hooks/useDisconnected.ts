import { getCurrentComponent } from "../keys.js";

/**
 * Runs `callback` after this component is disconnected.
 */
export function useDisconnected(callback: () => any) {
  const core = getCurrentComponent();
  core.onDisconnected(callback);
}
