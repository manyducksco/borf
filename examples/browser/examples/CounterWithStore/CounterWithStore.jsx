import { useStore } from "@borf/browser";
import { CounterStore } from "../../globals/CounterStore.js";
import { ExampleFrame } from "../../views/ExampleFrame/index.js";

/**
 * Component with controls and a mapped label based on a readable inside a store.
 */
export function CounterWithStore() {
  const { $current, reset } = useStore(CounterStore);
  const $label = $current.map((n) => `the number is: ${n}`);

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
function CounterViewLabel() {
  const { $current } = useStore(CounterStore);

  return <h1>{$current}</h1>;
}
