import { getCurrentContext } from "../component.js";

/**
 * Runs `callback` after this component is disconnected.
 */
export function useDisconnected(callback: () => any) {
  const ctx = getCurrentContext();
  ctx.disconnectedCallbacks.push(callback);
}
