import { makeApp, makeRef, makeView, makeLocal, makeGlobal, makeSpring, makeState, joinStates } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeRef).toBe("function");
  expect(typeof makeView).toBe("function");
  expect(typeof makeLocal).toBe("function");
  expect(typeof makeGlobal).toBe("function");
  expect(typeof makeSpring).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof joinStates).toBe("function");
});
