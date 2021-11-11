import woof, { state } from "../dist/woof";

test("exports expected things", () => {
  expect(typeof woof).toBe("function");
  expect(typeof state).toBe("function");
});

test("default function creates a working Woof instance", () => {
  const app = woof();

  console.log(app);
});
