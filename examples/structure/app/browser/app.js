import { App, html } from "@borf/browser";

const app = new App();

app.setRootView(() => {
  return html`
    <h1>App Example</h1>
    <p>This is an app.</p>
  `;
});

app.connect("#app");
