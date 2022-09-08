import { makeState } from "@woofjs/client";
import { prop } from "ramda";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export function MyHeader() {
  const { $attrs } = this;

  const http = this.getService("http");

  const onclick = $attrs.get("onclick");
  const $greeting = $attrs.map(prop("greeting"));
  const $name = makeState("...");

  this.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      $name.set(res.body.name);
    });
  });

  return (
    <h1 onclick={onclick}>
      {$greeting}, {$name}
    </h1>
  );
}
