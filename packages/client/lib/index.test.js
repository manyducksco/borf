import { makeApp, makeGlobal, makeView, makeTransitions } from "./index.js";

test("exports expected things", () => {
  expect(typeof makeApp).toBe("function");
  expect(typeof makeView).toBe("function");
  expect(typeof makeGlobal).toBe("function");
  expect(typeof makeTransitions).toBe("function");
});
