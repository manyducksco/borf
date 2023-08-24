import { ExampleFrame } from "../views/ExampleFrame";

export default function CrashHandling(_, ctx) {
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
