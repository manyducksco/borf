// In this file are symbol keys for accessing internal state on objects that are otherwise exposed to the end user.

import symbolObservable from "symbol-observable";

export const OBSERVABLE = symbolObservable;
export const READABLE = Symbol("Readable");
export const WRITABLE = Symbol("Writable");

export const APP_CONTEXT = Symbol("appContext");
export const ELEMENT_CONTEXT = Symbol("elementContext");

// Passed to Store and View constructors when used within woofe.
// The user will get an error redirecting them to Store.define or extending the Store class instead.
export const KEY = Symbol("🔑");
