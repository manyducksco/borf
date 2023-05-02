import { useCrash } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function CrashHandling() {
  const crash = useCrash();

  return (
    <ExampleFrame title="Crash Handling">
      <div>
        <button
          onclick={() => {
            crash(new Error("The forbidden button was clicked."));
          }}
        >
          Do not press!
        </button>
      </div>
    </ExampleFrame>
  );
}
