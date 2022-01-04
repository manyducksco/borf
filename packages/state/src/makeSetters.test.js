import { makeState } from "./makeState.js";
import { makeSetters } from "./makeSetters.js";

test("init as factory function", () => {
  const $state = makeState(1);

  const makeCounter = makeSetters({
    add: (current, value = 1) => current + value,
    subtract: (current, value = 1) => current - value,
  });

  const counter = makeCounter($state);

  expect($state.get()).toBe(1);

  counter.add(3);
  expect($state.get()).toBe(4);

  counter.subtract(5);
  expect($state.get()).toBe(-1);
});

test("init as instance", () => {
  const $state = makeState(1);

  const counter = makeSetters($state, {
    add: (current, value = 1) => current + value,
    subtract: (current, value = 1) => current - value,
  });

  expect($state.get()).toBe(1);

  counter.add(3);
  expect($state.get()).toBe(4);

  counter.subtract(5);
  expect($state.get()).toBe(-1);
});
