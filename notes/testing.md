# Testing and Development

While creating components, you probably want to make sure they're working as intended in a controlled environment. There are a few tools for this.

## Testing Views

For Views, we have the Viewer which displays components in an isolated environment similar to Storybook. This is where you would develop a component and do interactive and visual testing.

```tsx
import { makeViewer } from "woofe/viewer";
import { ButtonView } from "./ButtonView";
import { RandomStore } from "./RandomStore";

export default makeViewer(ButtonView, {
  // Provide any stores the view will use.
  stores: [
    {
      store: RandomStore,
      exports: {
        /* mock exports here */
      },
    },
  ],

  // Provide a default 'onclick' attr to all presets.
  attrs: {
    onclick: () => {
      console.log("Clicked!");
    },
  },

  // Wrap all presets in a padded container for presentation.
  decorator: (Viewer, m) => {
    return (
      <div style={{ padding: 16, backgroundColor: "#ccc", borderRadius: 8 }}>
        <Viewer />
      </div>
    );
  },

  // Supply a preset to show the view in each configuration you want to demonstrate.
  presets: [
    {
      name: "Primary",
      // Preset attrs are merged with default viewer attrs, so this will include the 'onclick' when connected.
      attrs: {
        variant: "primary",
      },
      // Decorate the preset to provide the button a label.
      decorator: (Viewer, m) => {
        return <Viewer>I am a Primary button!</Viewer>;
      },
    },
    {
      name: "Primary",
      attrs: {
        variant: "secondary",
      },
      decorator: (Viewer, m) => {
        return <Viewer>I am a Secondary button!</Viewer>;
      },
    },
  ],
});
```

And this is what the ButtonView looks like:

```tsx
import { View } from "woofe";

import styles from "./ButtonView.module.css";

export class ButtonView extends View {
  static about = "A button that does things when you click it.";
  static attrs = {
    variant: {
      type: "string",
      default: "primary",
    },
    onclick: {
      type: "function",
    },
  };

  setup(ctx) {
    const { variant, onclick } = ctx.attrs.get();

    return (
      <button class={[styles.button, styles[variant]]} onclick={onclick}>
        {ctx.outlet()}
      </button>
    );
  }
}
```

## Testing Stores

The viewer can also be used for Stores. When a Store is selected, you will see a stylized printout of the current export as a JS object. The viewer takes the same options regardless of View or Store, and you can interact with it in the same way as a View by tweaking attributes and controlling the lifecycle in the browser.

```tsx
import { makeViewer } from "woofe/viewer";
import { SomeStore } from "./SomeStore";

// Takes the same config object as a view. Just displays differently when you have the viewer open.
// You can still manipulate attributes and switch presets as you can with a view.
export default makeViewer(SomeStore, {
  // Configure here.
});
```

Test wrappers for components are available in `woofe/testing` for use in automated tests.

```tsx
import test from "ava";
import { wrapStore } from "woofe/testing";
import { SomeStore } from "./SomeStore";

test("works", async (t) => {
  const store = wrapStore(SomeStore, {
    stores: [
      // ... mock other stores as needed
    ],
    attrs: {
      initialValue: 5,
    },
  });

  // Run beforeConnect, connect the store, then run afterConnect.
  await store.connect();

  // Test exports.
  t.deepEqual(store.exports, {
    value: 5,
  });

  // Run beforeDisconnect, disconnect the store, then run afterDisconnect.
  await store.disconnect();
});
```

This could also be done with Views. The view wrapper simulates rendering, allowing you to query for "rendered" DOM nodes without actually displaying anything.

```tsx
import test from "ava";
import { wrapView } from "woofe/testing";
import { SomeView } from "./SomeView";

test("works", async (t) => {
  const view = wrapView(SomeView, {
    // Provide options:
    stores: [],
    attrs: {},
  });

  // Set up
  await view.connect();

  // Check that button is not rendered with default attributes.
  t.falsy(view.querySelector("button[data-test-id='the-button']"));

  // Check that button is rendered when showButton is true.
  view.attrs.set("showButton", true);
  t.truthy(view.querySelector("button[data-test-id='the-button']"));

  // Check that button is not rendered when showButton is false.
  view.attrs.set("showButton", false);
  t.falsy(view.querySelector("button[data-test-id='the-button']"));

  // Tear down
  await view.disconnect();
});
```
