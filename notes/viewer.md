# Component Viewer

Container for components that gets built into a Storybook-like isolated environment when you run `borf viewer`.

```js
import { Viewer, StringWidget } from "borf";
import { ExampleView } from "./ExampleView";

const viewer = new Viewer(ExampleView);

// Add presets to demonstrate various states of the component.
viewer.preset("Preset Name", {
  // Describe things to add inline documentation to your viewers.
  describe: "An example preset.",
  // Override and add stores per-preset.
  stores: [{ store: StoreOne, override: MockStoreOne }, StoreTwo],
  attributes: {
    // Users can interact with attributes through widgets which provide a UI and bind its value.
    value: new StringWidget("default-value", {
      /* Options for this widget */
      describe: "A value used by ExampleView.",
    }),
  },
});

export default viewer;
```

Running this command will start a server at some open port that serves a component inspector. Components are displayed in a tree view along the left side, according to their file system location relative to the project root.

Under each component in the tree you see a list of all presets. Selecting a preset will display the component in the center of the screen with description and any widgets visible in the right hand sidebar.

## Implementation

- Display components inside an iframe, so there must be a server app and a bundled views app.
