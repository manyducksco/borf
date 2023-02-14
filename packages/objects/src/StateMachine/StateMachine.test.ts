import test from "ava";
import { StateMachine } from "./StateMachine.js";

test("works", (t) => {
  const lights = new StateMachine("red", {
    red: ["green"],
    green: ["yellow"],
    yellow: ["red"],
  });

  t.falsy(lights.to("yellow")); // Can't go red -> yellow
  t.falsy(lights.to("red")); // Can't go red -> red
  t.truthy(lights.to("green")); // Can go to green

  t.is(lights.state, "green"); // Make sure the state stuck
});
