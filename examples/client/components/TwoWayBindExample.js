import { bind, makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export function TwoWayBindExample() {
  this.debug.name = "TwoWayBindExample";

  logLifecycle(this);

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
}
