import { View } from "@frameworke/fronte";
import logLifecycle from "../../utils/logLifecycle";
import { ExampleFrame } from "../../views/ExampleFrame";

export const CrashHandling = View.define({
  label: "CrashHandling",
  setup(ctx) {
    logLifecycle(ctx);

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
