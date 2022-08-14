/* ----- deprecated factory functions ----- */

import { App } from "./App.js";
import { State } from "./State.js";

export function makeApp(options) {
  console.trace(`makeApp is deprecated; use 'new App(options)' instead.`);

  return new App(options);
}

export function makeState(initialValue) {
  console.trace(`makeState is deprecated; use 'new State(initialValue)' instead.`);

  return new State(initialValue);
}

// export function mergeStates(...args) {
//   console.warn(`makeState is deprecated; use 'State.merge(...states).into((...values) => result)' instead.`);

//   const fn = args.pop();

//   return new State.merge(...args).into(fn);
// }

/* ----- /deprecated factory functions ----- */

export { App } from "./App.js";
export { Component } from "./Component.js";
export { Service } from "./Service.js";
export { State } from "./State.js";

export { h, when, unless, repeat, watch, bind } from "./h.js";

// NOTE: These are becoming static methods on State
export { mergeStates } from "./state/mergeStates.js";
export { makeProxyState } from "./state/makeProxyState.js";
