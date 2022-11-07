# Modules

Apps may need a way to segregate related globals and routes into their own container. This would let a developer
restrict access to certain state only to the routes that belong to that feature.

## Global overrides

A global named `example` in a module would override one with same name on the app. If no global exists with the given
name on the module, it falls back to the one on the app. This allows one copy of the `http` global (for example) to be
used by every module, but `example` to refer to the module's own version.

## Code

```js
import { makeApp, makeModule } from "https://cdn.skypack.dev/@woofjs/client";

// First the module:
const mod = makeModule();

mod.global("counter", (ctx) => {
  const $$count = ctx.state(0);

  function increment() {
    $$count.update("count", (current) => current + 1);
  }

  ctx.afterConnect(() => {
    setInterval(increment, 1000);
  });

  return {
    $count: $$count.readable(),
  };
});

mod.route("/test", function (ctx) {
  const { $count } = ctx.global("counter");

  return h("h1", "The count is", $count);
});

// Then mounted on an app:
const app = makeApp();

app.route("/module", mod);
```

The above example creates one route at `/module/test` that displays the current value of `$count`. Only that route (and
any future routes added to `mod`) will be able to access the `counter` global.

> This kind of implies you'll be able to mount yet another module on a route of a module. Should this be possible? Would
> it cause any challenges with implementing routing?

## Lazy loading modules

Modules can be lazy loaded from a URL. Helpful for large modules which have functionality you don't want to load until
someone actually goes there.

```js
// Pass a path to a module to lazily import only when the route matches.
app.route("/module", "/example/some-module.js");
```

This call expects `some-module.js` to be an ES module with the woof module as its default export. Something like the
following should work:

```js
import { makeModule } from "https://cdn.skypack.dev/@woofjs/client";

const mod = makeModule();

mod.global("counter", (ctx) => {
  const $$count = ctx.state(0);

  function increment() {
    $$count.update((current) => current + 1);
  }

  ctx.afterConnect(() => {
    setInterval(increment, 1000);
  });

  return {
    $count: $$count.readable(),
  };
});

mod.route("/test", function (ctx, h) {
  const { $count } = ctx.global("counter");

  return h("h1", "The count is", $count);
});

export default mod;
```
