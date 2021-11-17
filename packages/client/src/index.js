import { App } from "./structuring/App.js";

export * from "./structuring/Component.js";
export * from "./structuring/Service.js";
export * from "./storing/state.js";

export * from "./Keyboard.js";
export * from "./Styles.js";
export * from "./assert.js";

export default function woof(options) {
  return new App(options);
}
