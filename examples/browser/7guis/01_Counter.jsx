import { Writable, View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default new View({
  label: "7guis:Counter",

  setup(ctx) {
    const $$count = new Writable(0);

    return (
      <ExampleFrame title="1. Counter">
        <div>
          <input type="text" value={$$count.toReadable()} disabled />
          <button
            onclick={() => {
              $$count.update((n) => n + 1);
            }}
          >
            Increment
          </button>
        </div>
      </ExampleFrame>
    );
  },
});
