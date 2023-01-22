import { extendsClass } from "./extendsClass.js";

test("accurately detects if a class extends another", () => {
  class A {}
  class B {}
  class AA extends A {}
  class AAA extends AA {}

  expect(extendsClass(A, AA)).toBe(true);
  expect(extendsClass(AA, AAA)).toBe(true);
  expect(extendsClass(A, AAA)).toBe(true);

  expect(extendsClass(A, B)).toBe(false);
});

test("supports currying", () => {
  class A {}
  class AA extends A {}
  class B {}

  const extendsA = extendsClass(A);

  expect(extendsA(AA)).toBe(true);
  expect(extendsA(B)).toBe(false);
});
