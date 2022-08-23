import { bind, makeComponent, makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const TwoWayBindExample = makeComponent((ctx) => {
  ctx.debug.name = "TwoWayBindExample";

  logLifecycle(ctx);

  const $text = makeState("edit me");
  const $size = makeState(18);

  return (
    <div class="example">
      <h3>
        Two way data binding with <code>bind()</code>
      </h3>
      <div>
        <input value={bind($text)} />
        <input value={bind($size)} type="number" />{" "}
        {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: $size.map((s) => s + "px"),
          }}
        >
          {$text}
        </p>
      </div>
    </div>
  );
});
