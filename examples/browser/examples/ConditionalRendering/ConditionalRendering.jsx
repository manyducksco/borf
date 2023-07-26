import { Writable, cond } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function ConditionalRendering(_, c) {
  const $$show = new Writable(true);

  return (
    <ExampleFrame title="Conditional Rendering">
      <div>
        {cond($$show, <h1>Now you see me</h1>)}

        <div>
          <button
            onclick={() => {
              $$show.value = false;
            }}
            disabled={$$show.map((x) => !x)}
          >
            Hide
          </button>

          <button
            onclick={() => {
              $$show.value = true;
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
