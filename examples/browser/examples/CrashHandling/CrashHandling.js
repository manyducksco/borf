import { m } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function CrashHandling(self) {
  return m(ExampleFrame, { title: "CrashHandling" }, [
    m("div", [
      m(
        "button",
        {
          onclick: () => {
            self.crash(new Error("The forbidden button was clicked."));
          },
        },
        "Do not press!"
      ),
    ]),
  ]);
}
