import { makeView } from "@woofjs/client";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export const MyHeader = makeView((ctx) => {
  const http = ctx.global("http");

  const $$greeting = ctx.state("Hello");
  const $$name = ctx.state("Friend");

  const { onclick } = ctx.attrs;

  ctx.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      $$name.set(res.body.name);
    });
  });

  return (
    <h1 onclick={onclick}>
      {$$greeting}, {$$name}
    </h1>
  );
});
