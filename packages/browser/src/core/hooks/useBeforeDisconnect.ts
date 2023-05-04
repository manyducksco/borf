import { getCurrentContext } from "../component.js";

/**
 * Runs `callback` and awaits its promise before `useDisconnected` callbacks are called.
 * Component is not removed from the DOM until all `useBeforeDisconnect` promises resolve.
 */
export function useBeforeDisconnect(callback: () => Promise<any>) {
  const ctx = getCurrentContext();
  ctx.beforeConnectCallbacks.push(callback);
}
