# 🐕🪟 @woofjs/window

Develop components in isolation and poke at their state while they run to see what blows up. `@woofjs/window` is a
debugger and playground for `@woofjs/client` views.

## How to Use

First, install this package in your Woof project as a dev dependency.

```
npm i --save-dev @woofjs/window
```

Installing this package makes the `woof-window` command available in `package.json` scripts.

```json
{
  "scripts": {
    "window": "woof-window start ./path/to/client.js"
  }
}
```

Inside your project, you can create `<Name>.window.js` files for each of your views. Here is an example view:

```js
// MyHeader.jsx

export function MyHeader(ctx) {
  const http = ctx.global("http");

  ctx.defaultState = {
    greeting: "Hello",
    name: "...",
  };

  ctx.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      ctx.set("name", res.body.name);
    });
  });

  const onclick = ctx.get("onclick");
  const $greeting = ctx.readable("greeting");
  const $name = ctx.readable("name");

  return (
    <h1 onclick={onclick}>
      {$greeting}, {$name}
    </h1>
  );
}
```

And here is a hypothetical window to test it:

```js
// MyHeader.window.jsx

import { MyHeader } from "./MyHeader.jsx";
import { makeWindow } from "@woofjs/window";
import { makeMockHTTP } from "@woofjs/client/testing";

const mockHTTP = makeMockHTTP((ctx) => {
  ctx.get("/users/me", () => {
    return {
      name: "Jimbo",
    };
  });
});

export default makeWindow(MyHeader, {
  setup: function (ctx) {
    // Register mocks for globals MyHeader expects to use.
    ctx.global("http", mockHTTP);
  },

  description: "A dumb header that makes an API call to get the user's name.",

  // Panes offer slightly different points of view when looking at a view through a window.
  // Panes are state snapshots for testing various conditions in the view.
  panes: [
    {
      name: "Defaults",
      description: "Default state, no modifications.",
      state: {},
    },
    {
      name: "Custom Greeting",
      description:
        "Custom greetings allow customization for different languages.",
      state: { greeting: "Yo" },
    },
  ],
});
```

## Commands

### `start`

Starts an HTTP server you can visit in your browser.

### `build`

> TODO: Implement

Bundles the project's views into a standalone static file dump that you can host on just about any web server.

Use the `-o` or `--output` option to specify where this folder will go. For example,

```
woof-window build -o ./view-static
```

---

🦆
