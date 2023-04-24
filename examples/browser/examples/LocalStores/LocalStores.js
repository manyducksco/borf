import { m, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function LocalStores(self) {
  return m(ExampleFrame, { title: "Local State with Stores" }, [
    m.p(
      `You should be seeing "Hello from Instance 1" and "Hello from Instance 2" below this.`
    ),

    m.ul(
      m(ExampleStore, { initialValue: "Instance 1" }, [
        m(ValueDisplay),
        m(ExampleStore, { initialValue: "Instance 2" }, m(ValueDisplay)),
      ])
    ),
  ]);
}

function ExampleStore(self) {
  const initialValue = self.inputs.get("initialValue") ?? "DEFAULT";

  return {
    $$value: new Writable(initialValue),
  };
}

function ValueDisplay(self) {
  const { $$value } = self.useStore(ExampleStore);

  return m.li("Hello from ", $$value);
}
