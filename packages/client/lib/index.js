import { makeApp } from "./makeApp.js";

export function woof(options) {
  return makeApp(options);
}

export default woof;

// export { makeState } from "./state/makeState.js";
// export { mergeStates } from "./state/mergeStates.js";

export { h, when, unless, repeat, watch, bind } from "./h.js";
export { Fragment } from "./views/Fragment.js";
