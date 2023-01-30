# Viewer

The Viewer displays components (Views and Stores) in an isolated environment similar to Storybook. This is where you would develop a component and do interactive and visual testing.

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

And this is what the example ButtonView looks like:

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

## Viewing Stores

The viewer can also be used for Stores. When a Store is selected, you will see a stylized printout of its exports as a JS object. The viewer takes the same options regardless of View or Store, and you can interact with it in the same way as a View by tweaking attributes and controlling the lifecycle in the browser.

```tsx
import { makeViewer } from "woofe/viewer";
import { SomeStore } from "./SomeStore";

// Takes the same config object as a view. Just displays differently when you have the viewer open.
// You can still manipulate attributes and switch presets as you can with a view.
export default makeViewer(SomeStore, {
  // Configure here.
});
```
