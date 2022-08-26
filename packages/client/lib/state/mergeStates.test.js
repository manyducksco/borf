import { makeState } from "./makeState.js";
import { mergeStates } from "./mergeStates.js";

test("produces a new value when dependent states change", () => {
  const state1 = makeState(false);
  const state2 = makeState(true);
  const bothTrue = mergeStates(state1, state2).into((...values) => !values.some((value) => value === false));

  expect(bothTrue.get()).toBe(false);

  state1.set(true);

  expect(bothTrue.get()).toBe(true);

  state2.set(false);

  expect(bothTrue.get()).toBe(false);
});

test("with method creates a new merge with additional states", () => {
  const $label = makeState("asdf");
  const $label2 = makeState(12345);
  const $label3 = makeState("123123");

  // Create a merge that can be extended with 'with' or channeled into a merge function with 'into'.
  const merge = mergeStates($label, $label2);

  // Create a merged state with values from the two current states.
  const $message1 = merge.into((one, two) => {
    return one + two;
  });

  // Create a new merge with a third state, and create a merged state with values from all three states.
  const $message2 = merge.with($label3).into((one, two, three) => {
    return one + two + three;
  });

  expect($message1.get()).toBe("asdf12345");
  expect($message2.get()).toBe("asdf12345123123");
});

test("produces a usable state without 'into' or 'with'", () => {
  const $number = makeState(1);
  const $string = makeState("hello");

  const $merged = mergeStates($number, $string);

  expect($merged.get()).toStrictEqual([1, "hello"]);

  $string.set("CHANGED");

  expect($merged.get()).toStrictEqual([1, "CHANGED"]);
});

test("is Observable", () => {
  const $value = makeState(1);
  const $multiply = makeState(2);

  const $merged = mergeStates($value, $multiply).into((value, multiply) => {
    return value * multiply;
  });

  const next = jest.fn();

  const subscription = $merged.subscribe(next);

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
