# Component Viewer

Container for components that gets built into a Storybook-like isolated environment when you run `borf viewer`.

```js
import { Viewer, StringWidget } from "@borf/viewer";
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

viewer.addTest("Test Name", async (t) => {
  // TODO: How does this work? Write unit tests to validate various component behavior.
  // Each test gets a fresh copy of the component to work with.

  // Create an instance of the view. Fails if return value is not view compatible.
  const view = await t.createView({
    stores: [StoreTwo],
    attributes: {
      /* values */
    },
    children: [
      /* markup */
    ],
  });

  await view.connect(); // Simulates connection to DOM

  // Query child elements and test their properties.
  const label = view.querySelector("#some-label");
  t.is(label.textContent, "This is the label's text content");

  await view.disconnect();

  // Create an instance of the store. Fails if return value is not store compatible.
  const store = await t.createStore({
    stores: [StoreTwo],
    attributes: {
      /* values */
    },
    children: [
      /* markup */
    ],
  });

  await store.connect();
  await store.disconnect();

  // test the exports of a store, for example:
  t.deepEqual(store.exports, {
    /* ... */
  });

  // Other standard assertions:
  t.is();
  t.not.is();
  t.throws(async () => {
    await t.createView({
      /* bad attributes, etc. */
    });
  }, /unexpected type/); // Regex to match error message
});

export default viewer;
```
