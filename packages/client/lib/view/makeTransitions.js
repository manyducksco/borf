import { TransitionsBlueprint } from "./blueprints/Transitions.js";

export function makeTransitions(transitions) {
  return function wrap(element) {
    return new TransitionsBlueprint(element, transitions);
  };
}
