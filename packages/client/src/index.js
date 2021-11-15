import { App } from "./scaffolding/App.js";

export * from "./scaffolding/Component.js";
export * from "./scaffolding/Service.js";
export * from "./storing/state.js";

export * from "./Keyboard.js";
export * from "./Styles.js";
export * from "./assert.js";

export default function woof(options) {
  return new App(options);
}
