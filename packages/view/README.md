# `@woofjs/view`

Rapid component development environment for Woof projects. Basically a minimalistic [Storybook](https://storybook.js.org/) for Woof.

## How to Use

First, install this package in your Woof project as a dev dependency.

```
npm i --save-dev @woofjs/view
```

Installing this package makes the `woof-view` command available in `package.json` scripts.

```json
{
  "scripts": {
    "view": "woof-view start"
  }
}
```

Inside your project, you can create `<Name>.view.jsx` files for each of your components. Here is an example component:

```js
// MyHeader.jsx

import { makeState } from "@woofjs/client";

/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export function MyHeader($attrs, self) {
  const onclick = $attrs.get("onclick");

  const $greeting = $attrs.map("greeting");
  const $name = makeState("...");

  self.beforeConnect(() => {
    self
      .getService("@http")
      .get("/users/me")
      .then((res) => {
        $name.set(res.body.name);
      });
  });

  return (
    <h1 onclick={onclick}>
      {$greeting}, {$name}
    </h1>
  );
}
```

And here is a hypothetical view file to test it:

```js
// MyHeader.view.jsx

import { MyHeader } from "./MyHeader.jsx";

import { h } from "@woofjs/client";
import { makeMockHTTP } from "@woofjs/client/testing";

/**
 * We are using makeMockHTTP from the testing tools to create an `@http` service
 * that returns mock data. This prevents the view from touching a real API.
 **/
const mockHTTP = makeMockHTTP((self) => {
  self.get("/users/me", () => {
    return [{ id: 1, name: "Jimbo Jones" }];
  });
});

/**
 * Views are defined by an exported function. This function receives a `view` object with variables
 * and methods to configure the view.
 **/
export function ViewOne(view) {
  // Views are named by converting the function name from "PascalCaseLikeThis" to "Sentence Case Like This".
  // If you don't like this conversion, you can override it to any string you want:
  view.name = "Custom name here";

  // Provide mock versions of any services used by your component.
  view.service("@http", mockHTTP);

  return h(MyHeader, {
    // You can expose attributes to make them editable in the browser with a dedicated UI.
    greeting: view.attribute("Bonjour", {
      // The attribute key is used as the name by default (`greeting` in this case), but you can provide your own:
      name: "The Greeting",

      // The type of input the user sees is chosen based on the data type by default.
      // A string attribute would normally show a text input. Here we use a dropdown menu instead with four preset options.
      input: {
        type: "select",
        options: ["Bonjour", "Howdy", "Konnichiwa"],
      },
    }),

    // Actions are no-op functions that log when they are called.
    // Useful as dummy functions to test that callbacks are working as you interact with components.
    onclick: view.action("header clicked"),
  });
}
```

## Commands

### `start`

Specifies the path to the client bundle entry point. This is where your app is created with `makeApp`.

---

🦆
