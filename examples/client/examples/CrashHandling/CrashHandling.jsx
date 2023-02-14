import { View } from "woofe";
import { ExampleFrame } from "../../views/ExampleFrame";

export class CrashHandling extends View {
  setup(ctx, m) {
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
  }
}
