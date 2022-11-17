import { makeState, makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Displays a div that toggles a class when clicked and a label based on the current status.
 */
export const ToggleExample = makeView((ctx) => {
  ctx.name = "ToggleExample";

  logLifecycle(ctx);

  const $$active = makeState(false);
  const $status = $$active.as((t) => (t ? "ON" : "OFF"));

  return (
    <div class="example">
      <h3>
        Dynamic classes and <code>.as()</code>
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
});
