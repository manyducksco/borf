import { makeState, View } from "@borf/browser";

export class ToggleExample extends View {
  static about =
    "Displays a div that toggles a class when clicked and a label based on the current status.";

  setup(ctx) {
    const $$active = makeState(false);
    const $status = $$active.map((t) => (t ? "ON" : "OFF"));

    return (
      <div class="example">
        <h3>
          Dynamic classes and <code>.map()</code>
        </h3>
        <div
          class={{ active: $$active }} // class "active" is applied while binding holds a truthy value
          onclick={() => {
            $$active.update((t) => !t);
          }}
        >
          {$status}
          &nbsp;(click to toggle)
        </div>
      </div>
    );
  }
}
