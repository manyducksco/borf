import { pick } from "./pick.js";

test("picks specified values from an object", () => {
  const original = {
    number: 1,
    string: "yes",
    boolean: true,
  };

  expect(pick(["number", "boolean"], original)).toStrictEqual({
    number: 1,
    boolean: true,
  });

  // Returns a function when called without the object.
  const onlyString = pick(["string"]);

  expect(typeof onlyString).toBe("function");
  expect(onlyString(original)).toStrictEqual({
    string: "yes",
  });
});
