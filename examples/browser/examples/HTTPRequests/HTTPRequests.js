import { Writable, Readable, m } from "@borf/browser";
import { ExampleFrame } from "../../views/ExampleFrame";

/**
 * @param {import("@borf/browser").ComponentCore} self
 */
export function HTTPRequests(self) {
  const $$loading = new Writable(false);
  const $$url = new Writable();

  const http = self.useStore("http");

  const $label = Readable.merge([$$loading, $$url], (loading, url) => {
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
      .finally(() => {
        $$loading.set(false);
      });
  }

  return m(ExampleFrame, { title: "HTTP Requests with 'http' global" }, [
    m.div(
      { style: { display: "flex", flexFlow: "column nowrap" } },
      m.button({ onclick }, "Get Dog"),
      $label,
      m.$if($$url, m.img({ style: { maxWidth: 300 }, src: $$url }))
    ),
  ]);
}
