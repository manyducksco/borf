import { observable } from "./observable";

test("get, set and listen", () => {
  const o = observable(5);

  expect(o()).toBe(5);

  const cancel = o((value) => {
    expect(value).toBe(8);
  });

  o(8);
  expect(o()).toBe(8);

  cancel();

  o(12);
  expect(o()).toBe(12);
});

test("map", () => {
  const o = observable(5);
  const m = o.map((n) => n * 2);

  expect(o()).toBe(5);
  expect(m()).toBe(10);

  o(2);
  expect(m()).toBe(4);

  m.cancel();

  o(6);

  expect(m()).toBe(4);
});

test("filter", () => {
  const o = observable(5);
  const m = o.map((n) => n * 2);

  expect(o()).toBe(5);
  expect(m()).toBe(10);

  o(2);
  expect(m()).toBe(4);

  m.cancel();

  o(6);

  expect(m()).toBe(4);
});
