import { writable, computed, cond } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function ConditionalRendering(_, c) {
  const $$show = writable(true);

  return (
    <ExampleFrame title="Conditional Rendering">
      <div>
        {cond($$show, <h1>Now you see me</h1>)}

        <div>
          <button
            onclick={() => {
              $$show.set(false);
            }}
            disabled={computed($$show, (x) => !x)}
          >
            Hide
          </button>

          <button
            onclick={() => {
              $$show.set(true);
            }}
            disabled={$$show}
          >
            Show
          </button>
        </div>

        {cond($$show, null, <span>(now you don't)</span>)}
      </div>
    </ExampleFrame>
  );
}
