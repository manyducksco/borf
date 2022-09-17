import { makeView } from "@woofjs/client";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export const MyHeader = makeView((ctx) => {
  ctx.defaultState = {
    greeting: "Hello",
    name: "Friend",
  };

  const http = ctx.global("http");
  const onclick = ctx.get("onclick");

  ctx.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      ctx.set("name", res.body.name);
    });
  });

  return (
    <h1 onclick={onclick}>
      {ctx.readable("greeting")}, {ctx.readable("name")}
    </h1>
  );
});
