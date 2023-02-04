import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";
import { Connectable } from "../classes/Connectable.js";
import { Markup } from "../classes/Markup.js";
import { Store } from "../classes/Store.js";
import { View } from "../classes/View.js";

/* ----- Primitive Types ----- */

export const isArray = (value) => Array.isArray(value);
export const isBoolean = (value) => value === true || value === false;
export const isFunction = (value) => typeof value === "function" && !isClass(value);
export const isNumber = (value) => typeof value === "number";
export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);
export const isString = (value) => typeof value === "string";
export const isClass = (value) => typeof value === "function" && /^\s*class\s+/.test(value.toString());

/* ----- Woofe & Exotic ----- */

export const isPromise = (value) => value != null && isFunction(value.then) && isFunction(value.catch);
export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);
export const isView = (value) => value != null && value.prototype instanceof View;
export const isStore = (value) => value != null && value.prototype instanceof Store;
export const isMarkup = (value) => value != null && value instanceof Markup;
export const isReadable = (value) => (value && value[READABLE] && value === value[READABLE]()) || false;
export const isWritable = (value) => (value && value[WRITABLE] && value === value[WRITABLE]()) || false;
export const isObservable = (value) => (value && value[OBSERVABLE] && value === value[OBSERVABLE]()) || false;
export const isConnectable = (value) => value != null && value.prototype instanceof Connectable;
