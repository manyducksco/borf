import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";

export const isFunction = (value) => typeof value === "function";

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);

export const isView = (value) => isObject(value) && value.isView === true;

export const isBlueprint = (value) => isObject(value) && value.isBlueprint === true;

export const isObservable = (value) => (value && value[OBSERVABLE] && value === value[OBSERVABLE]()) || false;
export const isReadable = (value) => (value && value[READABLE] && value === value[READABLE]()) || false;
export const isWritable = (value) => (value && value[WRITABLE] && value === value[WRITABLE]()) || false;
