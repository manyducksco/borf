import { makeComponent, makeState } from "@woofjs/app";
import logLifecycle from "../utils/logLifecycle.js";

/**
 * Displays a div that toggles a class when clicked and a label based on the current status.
 */
const ToggleExample = makeComponent(($, self) => {
  self.debug.name = "ToggleExample";

  logLifecycle(self);

  const $active = makeState(false);
  const $status = $active.map((current) => (current ? "ON" : "OFF"));

  return (
    <div class="example">
      <h3>
        Dynamic classes and <code>$state.map()</code>
      </h3>
      <div
        class={{ active: $active }} // class "active" is applied while $active holds a truthy value
        onclick={() => {
          $active.set((current) => !current);
        }}
      >
        {$.text($status)}
        &nbsp;(click to toggle)
      </div>
    </div>
  );
});

export default ToggleExample;
