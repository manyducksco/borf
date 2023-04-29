// In this file are symbol keys for accessing internal state on objects that are otherwise exposed to the end user.

import { type ComponentCore } from "./component.js";

export const READABLE = Symbol("Readable");
export const WRITABLE = Symbol("Writable");

export const APP_CONTEXT = Symbol("appContext");
export const ELEMENT_CONTEXT = Symbol("elementContext");
export const CHILDREN = Symbol("$$children");
export const INPUTS = Symbol("inputs");

export const COMPONENT_CORE = Symbol("ComponentCore");

/**
 * Used by components to set themselves as current while running the setup function.
 */
export function setCurrentComponent(core: ComponentCore<any>) {
  (window as any)[COMPONENT_CORE] = core;
}

/**
 * Used by hooks to get the current component core.
 */
export function getCurrentComponent<I = unknown>(): ComponentCore<I> {
  const core = (window as any)[COMPONENT_CORE];
  if (!core) {
    throw new Error("Hooks must be called in the body of a component function.");
  }
  return core;
}

/**
 * Used by components to clear the current component after finished setting up.
 */
export function clearCurrentComponent() {
  (window as any)[COMPONENT_CORE] = undefined;
}
