// In this file are symbol keys for accessing internal state on objects that are otherwise exposed to the end user.

import symbolObservable from "symbol-observable";

export const OBSERVABLE = symbolObservable;
export const READABLE = Symbol("Readable");
export const WRITABLE = Symbol("Writable");

export const APP_CONTEXT = Symbol("appContext");

// Viewable goes on any object that can be constructed with an appContext, elementContext, attributes, etc. and rendered to the DOM.
export const IS_VIEWABLE = Symbol("Viewable");

export const IS_VIEW = Symbol("View");
export const IS_MARKUP = Symbol("Markup");
