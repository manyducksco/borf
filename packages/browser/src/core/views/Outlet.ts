import { getCurrentContext } from "../component.js";
import { Markup } from "../classes/Markup.js";
import { Dynamic } from "../classes/Dynamic.js";

/**
 * Displays the child elements of the view that renders it.
 */
export function Outlet(attrs: {}) {
  // Outlets are treated with special handling in the m() function.
  // It does not have its own context, so the $$children it displays are those of the parent's context.
  const ctx = getCurrentContext();

  return new Markup((config) => new Dynamic({ ...config, readable: ctx.$$children }));
}
