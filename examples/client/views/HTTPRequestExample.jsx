import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const HTTPRequestExample = makeView((ctx) => {
  ctx.name = "HTTPRequestExample";
  ctx.defaultState = {
    loading: false,
    message: "",
  };

  const http = ctx.global("http");

  logLifecycle(ctx);

  const $label = ctx.merge((state) => {
    if (state.loading) {
      return "LOADING...";
    } else {
      return state.message;
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
            ctx.set("loading", true);

            http
              .get("/hello-json")
              .header("accept", "application/json")
              .then((res) => {
                ctx.set("message", res.body.message);
              })
              .finally(() => {
                ctx.set("loading", false);
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
