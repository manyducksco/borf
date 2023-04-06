import test from "ava";
import { m, Markup } from "./Markup.js";
import { View } from "./View.js";

test("a", (t) => {
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

  t.assert(stringMarkup instanceof Markup);
  t.assert(viewMarkup instanceof Markup);
  t.assert(fnMarkup instanceof Markup);
});
