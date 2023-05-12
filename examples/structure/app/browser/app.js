import { App, m } from "@borf/browser";
import htm from "htm/mini";

const html = htm.bind(m);

const app = new App();

app.setRootView(() => {
  return html`
    <h1>App Example</h1>
    <p>This is an app.</p>
  `;
});

app.connect("#app");
