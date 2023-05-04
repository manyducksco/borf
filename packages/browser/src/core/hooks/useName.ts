import { getCurrentContext } from "../component.js";

/**
 * Sets the name of this component.
 */
export function useName(name: string) {
  const ctx = getCurrentContext();
  ctx.name = name;
}
