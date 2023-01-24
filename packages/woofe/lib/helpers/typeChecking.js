import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";
import { Connectable } from "../_experimental/Connectable.js";
import { Global } from "../_experimental/Global.js";
import { View } from "../_experimental/View.js";
import { extendsClass } from "./extendsClass.js";

export const isBoolean = (value) => value === true || value === false;

export const isFunction = (value) => typeof value === "function" && !isClass(value);

export const isString = (value) => typeof value === "string";

export const isNumber = (value) => typeof value === "number";

export const isArray = (value) => Array.isArray(value);

export const isObject = (value) => value != null && typeof value === "object" && !isArray(value);

export const isDOM = (value) => value != null && (value instanceof Node || value.isDOM === true);

export const isView = (value) => isClass(value) && extendsClass(View, value);

export const isGlobal = (value) => isClass(value) && extendsClass(Global, value);

export const isClass = (value) => typeof value === "function" && /^\s*class\s+/.test(value.toString());

export const isConnectable = (value) => value != null && extendsClass(Connectable, value);

export const isBlueprint = (value) => isObject(value) && value.isBlueprint === true;

export const isObservable = (value) => (value && value[OBSERVABLE] && value === value[OBSERVABLE]()) || false;

export const isReadable = (value) => (value && value[READABLE] && value === value[READABLE]()) || false;

export const isWritable = (value) => (value && value[WRITABLE] && value === value[WRITABLE]()) || false;
