import test from "ava";
import { View } from "./View.js";

test("define: returns a view", (t) => {
  const Test = View.define({
    setup: (ctx, m) => m("span", "hello"),
  });

  t.assert(View.isView(Test));
});
