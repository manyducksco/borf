import { getCurrentContext } from "../component.js";

/**
 * Runs `callback` after this component is connected.
 */
export function useConnected(callback: () => any) {
  const ctx = getCurrentContext();
  ctx.connectedCallbacks.push(callback);
}
