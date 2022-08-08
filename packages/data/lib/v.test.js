import { v } from "./v.js";

describe("exports", () => {
  expect(typeof v.boolean).toBe("function");
  expect(typeof v.func).toBe("function");
  expect(typeof v.number).toBe("function");
  expect(typeof v.object).toBe("function");
  expect(typeof v.string).toBe("function");
  expect(typeof v.symbol).toBe("function");

  expect(typeof v.arrayOf).toBe("function");
  expect(typeof v.custom).toBe("function");
  expect(typeof v.instanceOf).toBe("function");
  expect(typeof v.oneOf).toBe("function");
});

describe("v.boolean", () => {
  test("validates booleans", () => {
    const bool = v.boolean();

    expect(bool.validate(true).valid).toBe(true);
    expect(bool.validate(false).valid).toBe(true);
    expect(bool.validate("true").valid).toBe(false);
    expect(bool.validate(1).valid).toBe(false);
  });

  test("errors", () => {
    const bool = v.boolean();

    expect(bool.validate(7).errors).toStrictEqual([
      {
        path: [],
        message: "expected a boolean; received a number",
        received: 7,
      },
    ]);
  });
});

describe("v.func", () => {});

describe("v.number", () => {});

describe("v.object", () => {});

describe("v.string", () => {});

describe("v.symbol", () => {});

describe("v.arrayOf", () => {});

describe("v.custom", () => {});

describe("v.instanceOf", () => {});

describe("v.oneOf", () => {});
