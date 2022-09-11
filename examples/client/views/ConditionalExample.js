import { when } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export function ConditionalExample() {
  this.name = "ConditionalExample";
  this.defaultState = {
    show: false,
  };

  logLifecycle(this);

  const $$show = this.readWrite("show");
  const $label = $$show.to((t) => (t ? "Hide Text" : "Show Text"));

  return (
    <div class="example">
      <h3>
        Conditional rendering with <code>when()</code>
      </h3>
      <div>
        <button
          onclick={() => {
            $$show.set((current) => !current);
          }}
        >
          {$label}
        </button>
        {when($$show, <span>Hello there!</span>)}
      </div>
    </div>
  );
}
