import { makeComponent, makeState, mergeStates } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const HTTPRequestExample = makeComponent((ctx) => {
  const { http } = ctx.services;

  ctx.debug.name = "HTTPRequestExample";

  logLifecycle(ctx);

  const $loading = makeState(false);
  const $message = makeState("");

  const $label = mergeStates($message, $loading).into((message, loading) => {
    if (loading) {
      return "LOADING...";
    } else {
      return message;
    }
  });

  const getMessage = async () => {
    $loading.set(true);

    return http
      .get("/hello-json")
      .header("accept", "application/json")
      .then((res) => {
        $message.set(res.body.message);
      })
      .finally(() => {
        $loading.set(false);
      });
  };

  return (
    <div class="example">
      <h3>
        HTTP requests with <code>http</code> service
      </h3>
      <div>
        <button onclick={getMessage}>Get Message</button>
        {$label}
      </div>
    </div>
  );
});
