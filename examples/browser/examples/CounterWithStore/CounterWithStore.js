import { m } from "@borf/browser";
import { CounterStore } from "../../globals/CounterStore.js";
import { ExampleFrame } from "../../views/ExampleFrame/ExampleFrame.js";

/**
 * Component with controls and a mapped label based on a readable inside a store.
 */
export function CounterWithStore(self) {
  const counter = self.useStore(CounterStore);
  const $label = counter.$current.map((n) => `the number is: ${n}`);

  return m(ExampleFrame, { title: "Shared State with Stores" }, [
    m("div", [
      m("p", $label),
      m("button", { onclick: counter.reset }, "Reset"),
      m(CounterViewLabel),
      m(
        "p",
        "You'll notice the counter keeps its state and increments even when you're not on the page. This is because this state is stored in a global CounterStore. Global stores last for the lifetime of the app."
      ),
    ]),
  ]);
}

/**
 * Second component that displays the same information from the same store.
 */
function CounterViewLabel(self) {
  const { $current } = self.useStore(CounterStore);

  return m("h1", $current);
}
