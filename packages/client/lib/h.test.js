import { h } from "./h.js";
import { isTemplate } from "./helpers/typeChecking";

describe("h", () => {
  test("returns an element template", () => {
    const element = h("div");

    expect(isTemplate(element)).toBe(true);
  });
});
