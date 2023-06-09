import { Readable } from "../classes/Readable.js";
import { ComponentContext } from "../component.js";

export interface FlowDefaultAttributes {
  gap?: number | Readable<number> | Readable<number | undefined>;
  inset?: number | Readable<number> | Readable<number | undefined>;
}

export interface FlowStoreAttributes extends FlowDefaultAttributes {}

export function FlowStore(attrs: FlowStoreAttributes, ctx: ComponentContext) {
  return {};
}
