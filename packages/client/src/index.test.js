import { makeApp, makeComponent, makeService, makeState, mergeStates } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeComponent).toBe("function");
  expect(typeof makeService).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof mergeStates).toBe("function");
});
