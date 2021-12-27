import { createState } from "./createState.js";
import { combineStates } from "./combineStates.js";

test("produces a new value when dependent states change", () => {
  const state1 = createState(false);
  const state2 = createState(true);
  const bothTrue = combineStates(
    state1,
    state2,
    (...args) => !args.some((value) => value === false)
  );

  expect(bothTrue.get()).toBe(false);

  state1.set(true);

  expect(bothTrue.get()).toBe(true);

  state2.set(false);

  expect(bothTrue.get()).toBe(false);
});
