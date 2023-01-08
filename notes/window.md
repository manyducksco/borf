# View

The `@woofjs/view` library is no longer working and instead of upgrading it again I want to think about integrating the
functionality directly into the main client library. It can include a bin to start it and a separate `@woofjs/client/window`
import.

You look at a view through a window. A window has many panes, each offering a slightly different point of view.

```js
import { makeWindow } from "@woof/client/window";
import { Example } from "./Example.jsx";

export default makeWindow(Example, {
  description: "Description of the window.",
  panes: [
    {
      name: "Defaults",
      description: "Example window with the default settings.",
      state: {},
    },
    {
      name: "Type: Primary",
      description: "Example window as a primary button.",
      state: {
        type: "Primary",
      },
    },
    {
      name: "Type: Danger",
      description: "Example window as a danger button.",
      state: {
        type: "Danger",
      },
    },
  ],
});
```

Each pane represents a different test case. The `state` from the pane becomes the starting state when you switch to that
pane, then you as the developer are free to watch the state change as you interact with the view or modify the state
directly from the window runner.
