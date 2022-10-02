import { TransitionsBlueprint } from "./blueprints/Transitions.js";

export function makeTransitions(transitions) {
  return function animate(element) {
    return new TransitionsBlueprint(element, transitions);
  };
}
