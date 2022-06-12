import { v } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
function CounterExample($attrs, self) {
  self.debug.name = "CounterExample";

  logLifecycle(self);

  const counter = self.getService("counter");
  const $label = counter.$current.map((n) => ` the number is: ${n}`);

  return (
    <div class="example">
      <h3>Shared state with services</h3>
      <div>
        <p>{$label}</p>
        <button onclick={counter.reset}>Reset</button>
        <CounterViewLabel />
      </div>
    </div>
  );
}

export default CounterExample;

/**
 * Second component with a view only. Displays the same information from the same service.
 */
function CounterViewLabel($attrs, self) {
  const { $current } = self.getService("counter");

  return <h1>{$current}</h1>;
}
