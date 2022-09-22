import woof, {makeView, makeGlobal, h, makeTransitions} from "./index.js";

test("exports expected things", () => {
  expect(typeof woof).toBe("function");
  expect(typeof makeView).toBe("function");
  expect(typeof makeGlobal).toBe("function");
  expect(typeof makeTransitions).toBe("function");
  expect(typeof h).toBe("function");
});
