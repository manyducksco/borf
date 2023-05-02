import { Writable, when, useStore, useMerge } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

/**
 * Demonstrates HTTP requests with the built-in `http` store.
 */
export function HTTPRequests() {
  const $$loading = new Writable(false);
  const $$url = new Writable();

  const http = useStore("http");

  const $label = useMerge([$$loading, $$url], (loading, url) => {
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
        $$url.value = res.body.message;
      })
      .finally(() => {
        $$loading.value = false;
      });
  }

  return (
    <ExampleFrame title="HTTP Requests with 'http' store">
      <div style={{ display: "flex", flexFlow: "column nowrap" }}>
        <button onclick={onclick}>Get Dog</button>
        {$label}
        {when($$url, <img style={{ maxWidth: 300 }} src={$$url} />)}
      </div>
    </ExampleFrame>
  );
}
