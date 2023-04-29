import { html, useAttributes, useStore, Writable } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

export function LocalStores() {
  return html`
    <${ExampleFrame} title="Local State with Stores">
      <p>
        You should be seeing "Hello from Instance 1" and "Hello from Instance 2"
        below this.
      </p>

      <ul>
        <${ExampleStore} initialValue="Instance 1">
          <${ValueDisplay} />
          <${ExampleStore} initialValue="Instance 2">
            <${ValueDisplay} />
          <//>
        <//>
      </ul>
    <//>
  `;
}

function ExampleStore() {
  const attrs = useAttributes();
  const initialValue = attrs.get("initialValue") ?? "DEFAULT";

  return {
    $$value: new Writable(initialValue),
  };
}

function ValueDisplay() {
  const { $$value } = useStore(ExampleStore);

  return html`<li>Hello from ${$$value}</li>`;
}
