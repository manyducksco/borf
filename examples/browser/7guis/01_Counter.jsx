import { writable, computed } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (_, c) {
  c.name = "7GUIs:Counter";

  const $$count = writable(0);

  return (
    <ExampleFrame title="1. Counter">
      <div>
        <input
          type="text"
          // value={computed($$count, (x) => x.toString())}
          value={$$count}
          readonly
        />
        <button
          onclick={() => {
            $$count.update((x) => x + 1);
          }}
        >
          Increment
        </button>
      </div>
    </ExampleFrame>
  );
}
