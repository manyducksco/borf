# Miscellaneous Ideas

## Services object

Instead of `self.getService("name")`, components and other services would be able to access services with `self.services.name`.

```js
export function Example(ctx) {
  const { http, router } = ctx.services;
  const { h, makeState } = ctx.helpers;

  const $user = makeState();

  ctx.afterConnect(() => {
    http.get(`/users/${router.$params.get("userId")}`).then((res) => {
      $user.set(res.body);
    });
  });

  return h("div", [h("h1", $user.map("name")), h("p", $user.map("bio"))]);
}
```

The component above doesn't really make sense but it does show how the services could be accessed.

```js
export function Example(ctx) {
  ctx.$attrs;
  ctx.services;

  // Helpers included for library use (no imports needed, therefore no @woofjs/client peer dependency):
  const { h, when, unless, repeat, watch, bind, makeState, mergeStates } = ctx.helpers;

  ctx.beforeConnect(() => {});
  ctx.afterConnect(() => {});
  ctx.beforeDisconnect(() => {});
  ctx.afterDisconnect(() => {});
  ctx.watchState($state, (value) => {});

  // New async lifecycle hook for transitions
  ctx.transitionOut(async () => {
    /**
     * Use this to run exit animations and resolve once animation is complete.
     * The component waits for the promise to resolve before disconnecting.
     *
     * Only runs on the disconnected element; not for children, unlike the disconnect hooks that do
     * run for everything, even on route changes. This avoids running every transition at once when
     * routes change. In that case, only the top level route component should transition.
     */
  });
}
```

We could also put everything on a single `ctx` object. Services could then share a signature with components, only without `$attrs` or disconnect hooks.

## Repeat Ideas

```js
// More nonsense, but this would be what the combined context thing from earlier in this file might look like.
repeat($list, ({ $attrs, services: { page } }) => {
  const name = $attrs.map("value.name");

  page.$title.set(name);
});
```
