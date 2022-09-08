import logLifecycle from "../utils/logLifecycle.js";

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
export function CounterExample() {
  this.debug.name = "CounterExample";

  logLifecycle(this);

  const counter = this.getService("counter");
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

/**
 * Second component with a view only. Displays the same information from the same service.
 */
function CounterViewLabel() {
  const { $current } = this.getService("counter");

  return <h1>{$current}</h1>;
}
