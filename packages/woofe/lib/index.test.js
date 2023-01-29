import { isClass } from "./helpers/typeChecking.js";
import { makeApp, makeRef, makeSpring, makeState, joinStates, View, Local, Global } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeRef).toBe("function");
  expect(typeof makeSpring).toBe("function");
  expect(typeof makeState).toBe("function");
  expect(typeof joinStates).toBe("function");

  expect(isClass(View)).toBe(true);
  expect(isClass(Local)).toBe(true);
  expect(isClass(Global)).toBe(true);
});
