import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const HTTPRequestExample = makeView((ctx) => {
  ctx.name = "HTTPRequestExample";

  const $$loading = ctx.state(false);
  const $$message = ctx.state("");

  const http = ctx.global("http");

  logLifecycle(ctx);

  const $label = ctx.merge($$loading, $$message, (loading, message) => {
    if (loading) {
      return "LOADING...";
    } else {
      return message;
    }
  });

  return (
    <div class="example">
      <h3>
        HTTP requests with <code>http</code> global
      </h3>
      <div>
        <button
          onclick={() => {
            $$loading.set(true);

            http
              .get("/hello-json")
              .header("accept", "application/json")
              .then((res) => {
                $$message.set(res.body.message);
              })
              .finally(() => {
                $$loading.set(false);
              });
          }}
        >
          Get Message
        </button>

        {$label}
      </div>
    </div>
  );
});
