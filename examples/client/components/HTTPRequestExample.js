import { makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export default (self) => {
  const { http } = self.services;

  self.debug.name = "HTTPRequestExample";

  logLifecycle(self);

  const $loading = makeState(false);
  const $image = makeState();

  const $label = $loading.map((yes) => (yes ? "NOW LOADING..." : "Loaded!"));

  const refresh = () => {
    $loading.set(true);

    return http
      .get("https://dog.ceo/api/breeds/image/random")
      .then((res) => {
        $image.set(res.body.message);
      })
      .finally(() => {
        $loading.set(false);
      });
  };

  self.afterConnect(() => {
    refresh();
  });

  return (
    <div class="example">
      <h3>
        HTTP requests with <code>@http</code> service
      </h3>
      <div>
        <img
          src={$image}
          style={{
            height: "400px",
            border: "2px solid orange",
          }}
        />
        <button onclick={refresh}>Next Doggo</button>
        {$label}
      </div>
    </div>
  );
};
