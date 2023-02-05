import { View, Store, makeState } from "woofe";
import logLifecycle from "../utils/logLifecycle.js";

export class LocalsExample extends View {
  setup(ctx) {
    logLifecycle(ctx);

    return (
      <div class="example">
        <h3>Scoped state with locals.</h3>
        <div>
          <ExampleStore initialValue="Instance 1">
            <ValueDisplay />

            <ExampleStore initialValue="Instance 2">
              <ValueDisplay />
            </ExampleStore>
          </ExampleStore>
        </div>
      </div>
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

    return <span>{$$value}</span>;
  }
}
