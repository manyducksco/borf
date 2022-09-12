import logLifecycle from "../utils/logLifecycle.js";

export function HTTPRequestExample() {
  const http = this.global("http");

  this.name = "HTTPRequestExample";
  this.defaultState = {
    loading: false,
    message: "",
  };

  logLifecycle(this);

  const $label = this.merge((state) => {
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
            this.set("loading", true);

            http
              .get("/hello-json")
              .header("accept", "application/json")
              .then((res) => {
                this.set("message", res.body.message);
              })
              .finally(() => {
                this.set("loading", false);
              });
          }}
        >
          Get Message
        </button>

        {$label}
      </div>
    </div>
  );
}
