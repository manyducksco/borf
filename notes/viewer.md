# Component Viewer

Container for components that gets built into a Storybook-like isolated environment when you run `borf viewer`.

```js
import { Viewer, StringWidget } from "borf";
import { ExampleView } from "./ExampleView";

const viewer = new Viewer(ExampleView);

// Add presets to demonstrate various states of the component.
viewer.addPreset("Preset Name", {
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
