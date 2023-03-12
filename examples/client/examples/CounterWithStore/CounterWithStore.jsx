import { View } from "@frameworke/fronte";
import logLifecycle from "../../utils/logLifecycle.js";
import { CounterStore } from "../../globals/CounterStore.js";
import { ExampleFrame } from "../../views/ExampleFrame/ExampleFrame.jsx";

/**
 * Component with controls and a mapped label based on the state inside the service.
 */
export const CounterWithStore = View.define({
  label: "CounterWithStore",
  setup(ctx) {
    logLifecycle(ctx);

    const counter = ctx.useStore(CounterStore);
    const $label = counter.$current.as((n) => `the number is: ${n}`);

    return (
      <ExampleFrame title="Shared State with Stores">
        <div>
          <p>{$label}</p>
          <button onclick={counter.reset}>Reset</button>
          <CounterViewLabel />
          <p>
            You'll notice the counter keeps its state and increments even when
            you're not on the page. This is because this state is stored in a
            global CounterStore. Global stores last for the lifetime of the app.
          </p>
        </div>
      </ExampleFrame>
    );
  },
});

/**
 * Second component with a view only. Displays the same information from the same service.
 */
class CounterViewLabel extends View {
  setup(ctx) {
    const { $current } = ctx.useStore(CounterStore);

    return <h1>{$current}</h1>;
  }
}
