import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const TwoWayBindExample = makeView((ctx) => {
  ctx.name = "TwoWayBindExample";

  const $$text = ctx.state("edit me");
  const $$size = ctx.state(18);

  logLifecycle(ctx);

  return (
    <div class="example">
      <h3>
        Two way data binding with <code>.writable()</code>
      </h3>
      <div>
        <input value={$$text} />
        <input value={$$size} type="number" />{" "}
        {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: $$size.as((s) => s + "px"),
          }}
        >
          {$$text}
        </p>
      </div>
    </div>
  );
});
