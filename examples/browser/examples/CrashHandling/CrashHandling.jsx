import { View } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export const CrashHandling = View.define({
  label: "CrashHandling",
  setup(ctx) {
    return (
      <ExampleFrame title="Crash Handling">
        <div>
          <button
            onclick={() => {
              ctx.crash(new Error("The forbidden button was clicked."));
            }}
          >
            Do not press!
          </button>
        </div>
      </ExampleFrame>
    );
  },
});
