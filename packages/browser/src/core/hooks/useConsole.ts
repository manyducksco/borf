import { getCurrentContext } from "../component.js";

/**
 * Returns a replacement for the global `console` object that prints messages tagged with the component's name.
 */
export function useConsole() {
  const ctx = getCurrentContext();
  return ctx.debugChannel;
}
