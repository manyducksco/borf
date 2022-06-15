import { makeApp, makeState, mergeStates, h, when, unless, each, watch, bind } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof mergeStates).toBe("function");
  expect(typeof h).toBe("function");
  expect(typeof when).toBe("function");
  expect(typeof unless).toBe("function");
  expect(typeof each).toBe("function");
  expect(typeof watch).toBe("function");
  expect(typeof bind).toBe("function");
});
