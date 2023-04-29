import { getCurrentComponent } from "../keys.js";

/**
 * Runs `callback` and awaits its promise before `useConnected` callbacks are called.
 * Component is not considered connected until all `useBeforeConnect` promises resolve.
 */
export function useBeforeConnect(callback: () => Promise<any>) {
  const core = getCurrentComponent();
  core.beforeConnected(callback);
}
