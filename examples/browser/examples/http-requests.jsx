import { readable, writable, computed, cond } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

/**
 * Demonstrates HTTP requests with the built-in `http` store.
 */
export default function HTTPRequests(_, c) {
  const $$loading = writable(false);
  const $$url = writable();

  const http = c.getStore("http");

  const $label = computed([$$loading, $$url], ([loading, url]) => {
    c.log("computing label", { loading, url });
    if (loading) {
      return "LOADING...";
    } else {
      return "";
    }
  });

  function onclick() {
    $$loading.set(true);

    http
      .get("https://dog.ceo/api/breeds/image/random", {
        headers: {
          accept: "application/json",
        },
      })
      .then((res) => {
        $$url.set(res.body.message);
      })
      .catch(c.crash);
  }

  return (
    <ExampleFrame title="HTTP Requests with 'http' store">
      <div style={{ display: "flex", flexFlow: "column nowrap" }}>
        <button onclick={onclick}>Get Dog</button>
        {$label}
        {cond(
          $$url,
          <img
            style={{ maxWidth: 300 }}
            src={$$url}
            onload={() => {
              $$loading.set(false);
            }}
          />
        )}
      </div>
    </ExampleFrame>
  );
}
