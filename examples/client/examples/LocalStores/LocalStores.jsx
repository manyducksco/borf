import { View, Store, State } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle.js";

export class LocalStores extends View {
  setup(ctx) {
    logLifecycle(ctx);

    return (
      <ExampleFrame title="Local State with Stores">
        <p>You should be seeing "Instance 1" and "Instance 2" below this.</p>
        <ul>
          <ExampleStore initialValue="Instance 1">
            <ValueDisplay />

            <ExampleStore initialValue="Instance 2">
              <ValueDisplay />
            </ExampleStore>
          </ExampleStore>
        </ul>
      </ExampleFrame>
    );
  }
}

class ExampleStore extends Store {
  static inputs = {
    initialValue: {
      type: "string",
      default: "DEFAULT",
    },
  };

  setup(ctx) {
    return {
      $$value: new State(ctx.inputs.get("initialValue")),
    };
  }
}

class ValueDisplay extends View {
  setup(ctx) {
    const { $$value } = ctx.useStore(ExampleStore);

    return <li>Hello from {$$value}</li>;
  }
}
