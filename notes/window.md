# View

The `@woofjs/view` library is no longer working and instead of upgrading it again I want to think about integrating the
functionality directly into the main client library. It can include a bin to start it and a separate `@woofjs/client/window`
import.

You look at a view through a window. A window has many panes, each offering a slightly different point of view.

```js
import { makeViewer } from "woofle/viewer";
import { Example } from "./Example.jsx";

export default makeViewer(Example, {
  globals: {
    // Provide mock globals
    count: CountGlobal,
  },
  decorator: (view) => {
    // Decorator wraps the view, for example, with locals or in some kind of demo layout.
    return <ExampleLocal name="example">{view}</ExampleLocal>;
  },
  presets: [
    {
      name: "Defaults",
      description: "Example view with the default settings.",
      attributes: {},
      globals: {
        // Can override globals per preset.
        count: { value: 7 },
      },
      decorator: (view) => {
        // Adds an additional decorator for this preset INSIDE the top level decorator.
      },
    },
    {
      name: "Type: Primary",
      description: "Example view as a primary button.",
      attributes: {
        type: "primary",
      },
    },
    {
      name: "Type: Danger",
      description: "Example view as a danger button.",
      attributes: {
        type: "danger",
      },
    },
  ],
});
```
