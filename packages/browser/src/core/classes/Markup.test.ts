import { m, Markup } from "./Markup.js";
import { View } from "./View.js";

test("a", () => {
  const SomeView = View.define({
    inputs: {
      value: {
        example: "Hello World",
        default: "Default",
      },
    },

    setup(ctx, m) {
      return m("span", ctx.inputs.$("value"));
    },
  });

  const stringMarkup = m("div", { class: "test" }, "Hello");
  const viewMarkup = m(SomeView, { value: "Hello" });
  const fnMarkup = m((ctx, m) => {
    return m("div");
  });

  expect(stringMarkup instanceof Markup).toBe(true);
  expect(viewMarkup instanceof Markup).toBe(true);
  expect(fnMarkup instanceof Markup).toBe(true);
});
