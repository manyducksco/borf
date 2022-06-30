# `@woofjs/view`

Isolated component development environment for Woof projects. Basically a minimalistic [Storybook](https://storybook.js.org/) for Woof.

## How to Use

First, install this package in your Woof project as a dev dependency.

```
npm i --save-dev @woofjs/view
```

Installing this package makes the `woof-view` command available in `package.json` scripts.

```json
{
  "scripts": {
    "view": "woof-view start ./path/to/client.js"
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
import { makeMockHTTP } from "@woofjs/client/testing";

/**
 * Views are defined by an exported function. This function receives a `view` object with variables
 * and methods to configure the view. You can also export an object with view names as keys and
 * functions as values if you want to create multiple views for a single component.
 **/
export default (view) => {
  // Views are named by converting the function name from "PascalCaseLikeThis" to "Sentence Case Like This".
  // If you don't like this conversion, you can override it to any string you want:
  view.name = "Custom name here";

  // The description will be shown alongside the view. Use this space to explain what the purpose of the view is
  // and what unfamiliar users need to know. Supports Markdown formatting.
  view.description = `
    # Personalized Header

    This header displays a custom greeting and the user's name.
    You can select a few example greetings from a list in this view.
  `;

  // Provide mock versions of any services used by your component.
  view.service(
    "@http",
    /**
     * We are using makeMockHTTP from the testing tools to create an `@http` service
     * that returns mock data. This prevents the view from touching a real API.
     **/
    makeMockHTTP((self) => {
      self.get("/users/me", () => {
        // Log this event to the action log whenever the component makes a call to this mock API route.
        // This validates that the expected API calls are actually being made within the view.
        view.fireAction("requested user from API");

        return { id: 1, name: "Jimbo Jones" };
      });
    })
  );

  view.render(MyHeader, {
    // You can expose attributes to make them editable in the browser with a dedicated UI.
    greeting: view.attribute("Bonjour", {
      // The attribute key is used as the name by default (`greeting` in this case), but you can provide your own:
      name: "The Greeting",

      // Provide a description that will be displayed next to the input.
      description: "A phrase to greet the user with.",

      // The type of input the user sees is chosen based on the data type by default.
      // A string attribute would normally show a text input. Here we use a dropdown menu with preset options.
      input: {
        type: "select",
        options: ["Bonjour", "Howdy", "Konnichiwa"],
      },
    }),

    // Actions are no-op functions that log when they are called.
    // Useful as dummy functions to test that callbacks are working as you interact with components.
    onclick: view.action("header clicked"),
  });
};
```

## Commands

### `start`

Starts an HTTP server you can visit in your browser.

### `build`

> TODO: Implement

Bundles the project's views into a standalone static file dump that you can host on just about any web server.

Use the `-o` or `--output` option to specify where this folder will go. For example,

```
woof-view build -o ./view-static
```

## Attribute Inputs

Attributes let the user interact with their values using a variety of input widgets. A default input type will be chosen based on the attribute's default value if you don't specify one. You can always override this with an `input` object in the attribute options.

### Default Types

- string: `text`
- number: `number`
- boolean: `toggle`
- Date: `date`
- $state, array or object: `none`

### Text Input

Your basic text input. Takes a string.

```js
view.attribute("value", {
  input: {
    type: "text",
  },
});
```

### Number Input

Takes a number.

```js
view.attribute(10, {
  input: {
    type: "number",
  },
});
```

### Range Slider

Choose a numeric value within a range.

```js
view.attribute(10, {
  input: {
    type: "range",
    min: 5,
    max: 50,

    // optional (defaults to 1)
    step: 5,
  },
});
```

### Toggle

Toggle between `true` and `false`.

```js
view.attribute(true, {
  input: {
    type: "toggle",
  },
});
```

### Select (Dropdown Menu)

Choose one from a list of predefined options. Works best when there are many options.

```js
view.attribute(10, {
  input: {
    type: "select",
    options: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  },
});
```

### Radio

Choose one from a list of predefined options using radio buttons. Works best when there are fewer options.

```js
view.attribute("primary", {
  input: {
    type: "radio",
    options: ["primary", "secondary", "tertiary"],
  },
});
```

### Date

> TODO: Implement

Pick a date and time.

```js
view.attribute(new Date(2022, 10, 10), {
  input: {
    type: "date",
  },
});
```

### Color

Pick a color. The attribute value will be a CSS-compatible color string.

```js
view.attribute("#ff0088", {
  input: {
    type: "color",
  },
});
```

### None

Expose the attribute in the UI but don't provide any input for editing. Use this when you want to document an attribute but keep it read-only.

This is the default value for objects and arrays because structured data doesn't map well to simple input widgets. Consider using a `select` with predefined options for object/array attributes.

```js
view.attribute("value", {
  input: {
    type: "none",
  },
});
```

---

🦆
