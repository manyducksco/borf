import { View, Store, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";
import logLifecycle from "../../utils/logLifecycle.js";

export const LocalStores = View.define({
  label: "LocalStores",
  setup(ctx) {
    logLifecycle(ctx);

    return (
      <ExampleFrame title="Local State with Stores">
        <p>
          You should be seeing "Hello from Instance 1" and "Hello from Instance
          2" below this.
        </p>
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
  },
});

const ExampleStore = Store.define({
  label: "ExampleStore",
  inputs: {
    initialValue: {
      example: "A value.",
      default: "DEFAULT",
    },
  },

  setup(ctx) {
    return {
      $$value: new Writable(ctx.inputs.get("initialValue")),
    };
  },
});

const ValueDisplay = View.define({
  label: "ValueDisplay",
  setup(ctx) {
    const { $$value } = ctx.useStore(ExampleStore);

    return <li>Hello from {$$value}</li>;
  },
});
