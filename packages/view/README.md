# `@woofjs/view`

Rapid component development environment for Woof projects. Basically [Storybook](https://storybook.js.org/), but way faster, way lighter and it only works with Woof.

## How to Use

Install this package in your Woof project, then use it in your `package.json` scripts.

Installing this package makes the `woof-view` command available in scripts.

1. Install:

```
npm i --save-dev @woofjs/view
```

2. Add scripts:

```json
{
  "devDependencies": {
    "@woofjs/view": "~0.1.0"
  },
  "scripts": {
    "view": "woof-view start"
  }
}
```

Inside your project, you can create `<Name>.view.jsx` files for each of your components.

```js
import { h } from "@woofjs/client";
import { makeMockHTTP } from "@woofjs/client/testing";
import { MyHeader } from "./MyHeader.jsx";

/**
 * We are using makeMockHTTP from the testing tools to create an `@http` service that returns
 * mock data when used to make requests. This prevents the view from touching a real API.
 **/
const mockHTTP = makeMockHTTP((self) => {
  self.get("/users", () => {
    return [{ id: 1, name: "Jimbo Jones" }];
  });
});

/**
 * Views are defined similar to components. The function receives an object with variables
 * and methods to configure the view, and at the end it should return some renderable elements.
 **/
export function ViewOne(view) {
  // Views are named by converting the function name from PascalCase to Sentence Case.
  // If you don't like this you can override it to any string you want:
  view.name = "Custom name here";

  // Provide mock services for use by the elements you return.
  view.service("@http", mockHTTP);

  return h(MyHeader, {
    // Expose attributes to make them editable in the browser with a dedicated UI.

    title: view.attribute("The Value", {
      // Provide your own name or leave it out to use the attribute key (in this case "title").
      name: "The Title",

      // The type of control is chosen automatically by the browser. A string attribute would normally show a text input.
      // In this case we have overridden that to show a dropdown menu with four preset options.
      input: {
        type: "select",
        options: ["The Value", "Bonjour", "Howdy", "Konnichiwa"],
      },
    }),

    // Actions are no-op functions that log that they have been called. Useful as dummy functions to test that
    // callbacks are running as you expect as you interact with components.
    onclick: view.action("header clicked"),
  });
}
```

## Commands

### `start`

Specifies the path to the client bundle entry point. This is where your app is created with `makeApp`.

---

🦆
