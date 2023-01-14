import { LocalBlueprint } from "./blueprints/Local.js";

export function makeLocal(config) {
  return new LocalBlueprint(config);
}
