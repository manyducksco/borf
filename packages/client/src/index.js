import { App } from "./structure/App.js";

export * from "./structure/Component.js";
export * from "./structure/Service.js";
export * from "./data/state.js";

// export * from "./Keyboard.js";
export * from "./Styles.js";
export * from "./assert.js";

export default function woof(options) {
  return new App(options);
}
