import { makeState } from "./makeState.js";
import { makeGetters } from "./makeGetters.js";

test("init as factory function", () => {
  const $state = makeState(2);

  const makeMath = makeGetters({
    multiplied: (current, by) => current * by,
    negative: (current) => -current,
  });

  const math = makeMath($state);

  expect($state.get()).toBe(2);

  expect(math.multiplied(3)).toBe(6);
  expect($state.get()).toBe(2);

  expect(math.negative()).toBe(-2);
  expect($state.get()).toBe(2);
});

test("init as instance", () => {
  const $state = makeState(2);

  const math = makeGetters($state, {
    multiplied: (current, by) => current * by,
    negative: (current) => -current,
  });

  expect($state.get()).toBe(2);

  expect(math.multiplied(3)).toBe(6);
  expect($state.get()).toBe(2);

  expect(math.negative()).toBe(-2);
  expect($state.get()).toBe(2);
});
