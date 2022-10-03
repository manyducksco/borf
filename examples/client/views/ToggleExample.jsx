import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Displays a div that toggles a class when clicked and a label based on the current status.
 */
export const ToggleExample = makeView((ctx) => {
  ctx.name = "ToggleExample";
  ctx.defaultState = {
    active: false,
  };

  logLifecycle(ctx);

  const $active = ctx.readable("active");
  const $status = $active.to((t) => (t ? "ON" : "OFF"));

  return (
    <div class="example">
      <h3>
        Dynamic classes and <code>.to()</code>
      </h3>
      <div
        class={{ active: $active }} // class "active" is applied while binding holds a truthy value
        onclick={() => {
          ctx.set("active", (t) => !t);
        }}
      >
        {$status}
        &nbsp;(click to toggle)
      </div>
    </div>
  );
});