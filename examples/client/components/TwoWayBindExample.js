import { bind, State } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

function TwoWayBindExample(self) {
  self.debug.name = "TwoWayBindExample";

  logLifecycle(self);

  const $text = new State("edit me");
  const $size = new State(18);

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

export default TwoWayBindExample;
