import { makeComponent, makeState } from "@woofjs/app";
import logLifecycle from "../utils/logLifecycle.js";

const TwoWayBindExample = makeComponent(($, self) => {
  self.debug.name = "TwoWayBindExample";

  logLifecycle(self);

  const $text = makeState("edit me");
  const $size = makeState(18);

  return (
    <div class="example">
      <h3>
        Two way data binding with <code>$.bind()</code>
      </h3>
      <div>
        <input value={$.bind($text)} />
        <input value={$.bind($size)} type="number" /> {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: $size.map((s) => s + "px"),
          }}
        >
          {$.text($text)}
        </p>
      </div>
    </div>
  );
});

export default TwoWayBindExample;
