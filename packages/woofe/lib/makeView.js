import { ViewBlueprint } from "./blueprints/View.js";

export function makeView(config) {
  return new ViewBlueprint(config);
}
