import { Woof } from "./Woof";

export * from "./Component";
export * from "./Keys";
export * from "./Service";
export * from "./state";

export default function woof(options) {
  return new Woof(options);
}
