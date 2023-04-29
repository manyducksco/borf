import { html } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function CrashHandling() {
  return html`
    <${ExampleFrame} title="Crash Handling">
      <div>
        <button
          onclick=${() => {
            throw new Error("The forbidden button was clicked.");
          }}
        >
          Do not press!
        </button>
      </div>
    <//>
  `;
}
