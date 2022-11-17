import { h } from "./h.js";
import { isBlueprint } from "../helpers/typeChecking.js";

describe("h", () => {
  test("returns an element template", () => {
    const element = h("div");

    expect(isBlueprint(element)).toBe(true);
  });
});
