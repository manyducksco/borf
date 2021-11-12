import { App } from "./App";

export * from "./Component";
export * from "./Keyboard";
export * from "./Service";
export * from "./state";

export default function woof(options) {
  return new App(options);
}
