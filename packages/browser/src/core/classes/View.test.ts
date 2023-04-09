import test from "ava";
import { View } from "./View.js";

test("define: returns a view", (t) => {
  const Test = new View({
    setup: (ctx, m) => m("span", "hello"),
  });

  t.assert(View.isView(Test));
});
