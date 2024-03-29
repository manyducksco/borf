import { computed } from "@borf/browser";
import { CounterStore } from "../stores/CounterStore.js";
import { ExampleFrame } from "../views/ExampleFrame";

/**
 * Component with controls and a mapped label based on a readable inside a store.
 */
export default function CounterWithStore(_, ctx) {
  const { $current, reset } = ctx.getStore(CounterStore);
  const $label = computed($current, (n) => `the number is: ${n}`);

  return (
    <ExampleFrame title="Shared State with Stores">
      <div>
        <p>{$label}</p>
        <button onclick={reset}>Reset</button>
        <CounterViewLabel />
        <p>
          You'll notice the counter keeps its state and increments even when
          you're not on the page. This is because this state is stored in a
          global CounterStore. Global stores last for the lifetime of the app.
        </p>
      </div>
    </ExampleFrame>
  );
}

/**
 * Second component that displays the same information from the same store.
 */
function CounterViewLabel(_, ctx) {
  const { $current } = ctx.getStore(CounterStore);

  return <h1>{$current}</h1>;
}
