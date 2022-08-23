import { makeComponent } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
export const CounterExample = makeComponent((ctx) => {
  ctx.debug.name = "CounterExample";

  logLifecycle(ctx);

  const { counter } = ctx.services;
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
});

/**
 * Second component with a view only. Displays the same information from the same service.
 */
const CounterViewLabel = makeComponent((ctx) => {
  const { $current } = ctx.services.counter;

  return <h1>{$current}</h1>;
});
