import { makeState } from "./makeState.js";
import { mergeStates } from "./mergeStates.js";

test("produces a new value when dependent states change", () => {
  const state1 = makeState(false);
  const state2 = makeState(true);
  const bothTrue = mergeStates(state1, state2, (...args) => !args.some((value) => value === false));

  expect(bothTrue.get()).toBe(false);

  state1.set(true);

  expect(bothTrue.get()).toBe(true);

  state2.set(false);

  expect(bothTrue.get()).toBe(false);
});

test("is Observable", () => {
  const $value = makeState(1);
  const $multiply = makeState(2);

  const $merged = mergeStates($value, $multiply, (value, multiply) => {
    return value * multiply;
  });

  const next = jest.fn();

  const subscription = $merged.subscribe({
    next,
  });

  $value.set(2);
  $value.set(3);
  $value.set(4);

  subscription.unsubscribe();

  $value.set(5);

  expect(next).toHaveBeenCalledTimes(4);
  expect(next).toHaveBeenCalledWith(2);
  expect(next).toHaveBeenCalledWith(4);
  expect(next).toHaveBeenCalledWith(6);
  expect(next).toHaveBeenCalledWith(8);
  expect(next).not.toHaveBeenCalledWith(10);
});
