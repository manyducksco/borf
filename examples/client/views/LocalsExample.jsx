import { View, Local, makeState } from "woofe";
import logLifecycle from "../utils/logLifecycle.js";

export class LocalsExample extends View {
  setup(ctx) {
    logLifecycle(ctx);

    return (
      <div class="example">
        <h3>Scoped state with locals.</h3>
        <div>
          <ExampleLocal name="example" initialValue="Instance 1">
            <ValueDisplay />

            {/* <ExampleLocal name="example" initialValue="Instance 2">
              <ValueDisplay />
            </ExampleLocal> */}
          </ExampleLocal>
        </div>
      </div>
    );
  }
}

class ExampleLocal extends Local {
  static attrs = {
    initialValue: {
      type: "string",
      default: "DEFAULT",
    },
  };

  setup(ctx) {
    return {
      $$value: makeState(ctx.attributes.get("initialValue")),
    };
  }
}

class ValueDisplay extends View {
  setup(ctx) {
    const { $$value } = ctx.local("example");

    return <span>{$$value}</span>;
  }
}
