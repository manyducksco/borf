import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const TwoWayBindExample = makeView((ctx) => {
  ctx.name = "TwoWayBindExample";
  ctx.defaultState = {
    text: "edit me",
    size: 18,
  };

  logLifecycle(ctx);

  return (
    <div class="example">
      <h3>
        Two way data binding with <code>.writable()</code>
      </h3>
      <div>
        <input value={ctx.writable("text")} />
        <input value={ctx.writable("size")} type="number" />{" "}
        {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: ctx.readable("size").to((s) => s + "px"),
          }}
        >
          {ctx.readable("text")}
        </p>
      </div>
    </div>
  );
});
