import { getCurrentComponent } from "../keys.js";

/**
 * Runs `callback` and awaits its promise before `useDisconnected` callbacks are called.
 * Component is not removed from the DOM until all `useBeforeDisconnect` promises resolve.
 */
export function useBeforeDisconnect(callback: () => Promise<any>) {
  const core = getCurrentComponent();
  core.beforeDisconnected(callback);
}
