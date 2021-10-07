import { states } from "./main";

test("exports correct objects", () => {
  const state = states.create({
    test: 5,
  });

  const sub = state.subscribe("test");
  const fn = jest.fn();

  sub.receiver = fn;

  state.set("test", 2);

  expect(fn).toHaveBeenCalled();
});
