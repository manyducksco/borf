import { Writable, m } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (self) {
  self.setName("7GUIs:Counter");

  const $$count = new Writable(0);

  return m(ExampleFrame, { title: "1. Counter" }, [
    m("div", [
      m("input", { type: "text", value: $$count.toReadable, disabled: true }),
      m(
        "button",
        {
          onclick: () => {
            $$count.update((n) => n + 1);
          },
        },
        "Increment"
      ),
    ]),
  ]);
}
