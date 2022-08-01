import { joinPath } from "./joinPath.js";

test("joins simple path fragments", () => {
  expect(joinPath("users", 5, "edit")).toBe("users/5/edit");
  expect(joinPath("/lots", "/of/", "/slashes/")).toBe("/lots/of/slashes");
  expect(joinPath("even/", "/more/", "slashes")).toBe("even/more/slashes");
});

test("joining no items returns an empty string", () => {
  expect(joinPath()).toBe("");
});

test("resolves relative path segments", () => {
  expect(joinPath("users", 5, "edit", "../../12")).toBe("users/12");
  expect(joinPath("users", 15, "./edit")).toBe("users/15/edit");
});
