import { View, Store, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export const LocalStores = new View({
  label: "LocalStores",
  setup(ctx) {
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

const ExampleStore = new Store({
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

const ValueDisplay = new View({
  label: "ValueDisplay",
  setup(ctx) {
    const { $$value } = ctx.useStore(ExampleStore);

    return <li>Hello from {$$value}</li>;
  },
});
