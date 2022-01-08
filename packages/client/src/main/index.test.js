import { makeApp, makeComponent, makeService, makeState, mergeStates, Styles } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeComponent).toBe("function");
  expect(typeof makeService).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof mergeStates).toBe("function");
  expect(typeof Styles).toBe("function");
});
