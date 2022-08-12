export { App } from "./App.js";
export { Component } from "./Component.js";
export { Service } from "./Service.js";

export function makeApp(options) {
  return new App(options);
}

export { makeState } from "./state/makeState.js";
export { makeStore } from "./state/makeStore.js";
export { mergeStates } from "./state/mergeStates.js";
export { makeProxyState } from "./state/makeProxyState.js";

export { h, when, unless, repeat, watch, bind } from "./h.js";
