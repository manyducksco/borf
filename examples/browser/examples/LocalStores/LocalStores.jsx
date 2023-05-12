import { Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function LocalStores() {
  return (
    <ExampleFrame title="Local State with Stores">
      <p>
        You should be seeing "Hello from Instance 1" and "Hello from Instance 2"
        below this.
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
}

function ExampleStore({ initialValue }) {
  return {
    $$value: new Writable(initialValue ?? "DEFAULT"),
  };
}

function ValueDisplay(_, ctx) {
  const { $$value } = ctx.getStore(ExampleStore);

  return <li>Hello from {$$value}</li>;
}
