import { makeApp, v, when, unless, each, watch, bind, makeService, makeState, mergeStates } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof v).toBe("function");
  expect(typeof when).toBe("function");
  expect(typeof unless).toBe("function");
  expect(typeof each).toBe("function");
  expect(typeof watch).toBe("function");
  expect(typeof bind).toBe("function");
  expect(typeof makeService).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof mergeStates).toBe("function");
});
