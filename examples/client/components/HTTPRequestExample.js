import { makeComponent, makeState, mergeStates } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export default makeComponent((self) => {
  const { http } = self.services;

  self.debug.name = "HTTPRequestExample";

  logLifecycle(self);

  const $loading = makeState(false);
  const $message = makeState();

  const $label = mergeStates([$message, $loading], ([message, loading]) => {
    if (loading) {
      return "LOADING...";
    } else {
      return message;
    }
  });

  const getMessage = () => {
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
