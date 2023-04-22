// In this file are symbol keys for accessing internal state on objects that are otherwise exposed to the end user.

export const READABLE = Symbol("Readable");
export const WRITABLE = Symbol("Writable");

export const APP_CONTEXT = Symbol("appContext");
export const ELEMENT_CONTEXT = Symbol("elementContext");
export const CHILDREN = Symbol("$$children");
export const INPUTS = Symbol("inputs");
