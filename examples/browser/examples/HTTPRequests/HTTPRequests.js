import { Writable, Readable, html, when, useStore } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

/**
 * Demonstrates HTTP requests with the built-in `http` store.
 */
export function HTTPRequests() {
  const $$loading = new Writable(false);
  const $$url = new Writable();

  const http = useStore("http");

  const $label = Readable.merge([$$loading, $$url], (loading, url) => {
    if (loading) {
      return "LOADING...";
    } else {
      return "";
    }
  });

  function onclick() {
    $$loading.value = true;

    http
      .get("https://dog.ceo/api/breeds/image/random", {
        headers: {
          accept: "application/json",
        },
      })
      .then((res) => {
        $$url.set(res.body.message);
      })
      .finally(() => {
        $$loading.set(false);
      });
  }

  return html`
    <${ExampleFrame} title="HTTP Requests with 'http' store">
      <div style=${{ display: "flex", flexFlow: "column nowrap" }}>
        <button onclick=${onclick}>Get Dog</button>
        ${$label}
        ${when($$url, html`<img style=${{ maxWidth: 300 }} src=${$$url} />`)}
      </div>
    </${ExampleFrame}>
  `;
}
