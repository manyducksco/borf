import { makeState } from "@woofjs/client";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export function MyHeader({ $attrs, ...self }) {
  const { http } = self.services;

  const onclick = $attrs.get("onclick");

  const $greeting = $attrs.map((a) => a.greeting);
  const $name = makeState("...");

  self.beforeConnect(() => {
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
