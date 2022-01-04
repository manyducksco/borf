import { isState } from "./isState.js";
import { makeState } from "./makeState.js";

test("identifies a state", () => {
  expect(isState(makeState(5))).toBe(true);
  expect(isState({ isState: true })).toBe(true);
  expect(isState(function () {})).toBe(false);
});
