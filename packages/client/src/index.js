import { App } from "./App.js";

export * from "./state/state.js";
export * from "./Component.js";
export * from "./Service.js";
export * from "./Styles.js";

export default function woof(options) {
  return new App(options);
}
