import { Connectable } from "../classes/Connectable.js";
import { Markup } from "../classes/Markup.js";

export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);
export const isMarkup = (value) => value != null && value instanceof Markup;
export const isConnectable = (value) => value != null && value.prototype instanceof Connectable;
