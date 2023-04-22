import test from "ava";
import { m, Markup } from "./Markup.js";
import { ComponentCore } from "../scratch.js";

test("a", (t) => {
  function SomeView(self: ComponentCore<{ value: string }>) {
    return m("span", self.inputs.$("value"));
  }

  const stringMarkup = m("div", { class: "test" }, "Hello");
  const viewMarkup = m(SomeView, { value: "Hello" });
  const fnMarkup = m((self) => {
    return m("div");
  });

  t.assert(stringMarkup instanceof Markup);
  t.assert(viewMarkup instanceof Markup);
  t.assert(fnMarkup instanceof Markup);
});
