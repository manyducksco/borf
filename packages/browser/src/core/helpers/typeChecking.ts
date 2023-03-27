import { Connectable } from "../classes/Connectable.js";
import { Markup } from "../classes/Markup.js";

export function isDOM(value: any): boolean {
  return value != null && (value instanceof Node || value.isDOM === true);
}

export function isMarkup(value: any): value is Markup {
  return value != null && value instanceof Markup;
}

export function isConnectable(value: any): value is Connectable {
  return value != null && value.prototype instanceof Connectable;
}
