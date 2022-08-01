import { resolvePath } from "./resolvePath";

test("resolves relative paths", () => {
  expect(resolvePath("/users/5", ".")).toBe("/users/5");
  expect(resolvePath("/users/5/edit", "..")).toBe("/users/5");
  expect(resolvePath("/users/5/edit", "../../2/")).toBe("/users/2");
  expect(resolvePath("/users/5", "./edit")).toBe("/users/5/edit");
  expect(resolvePath("/users/5", "edit")).toBe("/users/5/edit");
  expect(resolvePath("/users/5/edit", "../delete")).toBe("/users/5/delete");
});

test("returns absolute paths", () => {
  expect(resolvePath("/users/5", "/edit")).toBe("/edit");
});
