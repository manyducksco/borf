import { View, Store, makeState } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle.js";

export class LocalStores extends View {
  setup(ctx) {
    logLifecycle(ctx);

    return (
      <ExampleFrame title="Local State with Stores">
        <p>You should be seeing "Instance 1" and "Instance 2" below this.</p>
        <div>
          <ExampleStore initialValue="Instance 1">
            <ValueDisplay />

            <ExampleStore initialValue="Instance 2">
              <ValueDisplay />
            </ExampleStore>
          </ExampleStore>
        </div>
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
      $$value: makeState(ctx.inputs.get("initialValue")),
    };
  }
}

class ValueDisplay extends View {
  setup(ctx) {
    const { $$value } = ctx.useStore(ExampleStore);

    return <span>Hello from {$$value}</span>;
  }
}
