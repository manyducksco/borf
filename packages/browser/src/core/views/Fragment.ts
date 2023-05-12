import { type ComponentContext } from "../component.js";

export function Fragment(_: {}, ctx: ComponentContext) {
  return ctx.outlet();
}
