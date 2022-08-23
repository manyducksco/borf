import { makeComponent, makeState } from "@woofjs/client";
import { prop } from "ramda";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export const MyHeader = makeComponent(({ $attrs, ...ctx }) => {
  const { http } = ctx.services;

  const onclick = $attrs.get("onclick");

  const $greeting = $attrs.map(prop("greeting"));
  const $name = makeState("...");

  ctx.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      $name.set(res.body.name);
    });
  });

  return (
    <h1 onclick={onclick}>
      {$greeting}, {$name}
    </h1>
  );
});
