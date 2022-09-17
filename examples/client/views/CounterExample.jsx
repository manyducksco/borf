import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
export const CounterExample = makeView((ctx) => {
  ctx.name = "CounterExample";

  logLifecycle(ctx);

  const counter = ctx.global("counter");
  const $label = counter.$current.to((n) => ` the number is: ${n}`);

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
const CounterViewLabel = makeView((ctx) => {
  const { $current } = ctx.global("counter");

  return <h1>{$current}</h1>;
});
