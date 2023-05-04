import { Writable, useName } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function () {
  useName("7GUIs:Counter");

  const $$count = new Writable(0);

  return (
    <ExampleFrame title="1. Counter">
      <div>
        <input type="text" value={$$count.toReadable()} readonly />
        <button
          onclick={() => {
            $$count.value += 1;
          }}
        >
          Increment
        </button>
      </div>
    </ExampleFrame>
  );
}
