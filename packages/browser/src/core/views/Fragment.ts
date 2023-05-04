import { getCurrentContext } from "../component.js";
import { Markup } from "../classes/Markup.js";
import { Dynamic } from "../classes/Dynamic.js";

export function Fragment() {
  // Like an Outlet, but a Fragment does have its own context and therefore renders its own children.
  const ctx = getCurrentContext();

  return new Markup((config) => new Dynamic({ ...config, readable: ctx.$$children }));
}
