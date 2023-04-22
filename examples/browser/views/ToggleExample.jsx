import { Writable, m } from "@borf/browser";
import { div, h3, code } from "@borf/browser/elements";

export function ToggleExampleView(self) {
  const $$active = new Writable(false);
  const $status = $$active.map((t) => (t ? "ON" : "OFF"));

  return div({ class: "example" }, [
    h3("Dynamic classes and ", code(".map()")),
    div(
      {
        class: { active: $$active }, // class "active" is applied while $$active holds a truthy value
        onclick: () => {
          $$active.update((t) => !t);
        },
      },
      $status,
      " (click to toggle)"
    ),
  ]);
}
