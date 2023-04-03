# Web Components

```jsx
import { Store, View, ElementHub } from "@borf/browser";

const hub = new ElementHub();

// Create a store that holds a title.
const TitleStore = Store.define({
  setup(ctx) {
    return {
      title: "This is the Title",
    };
  },
});

// Make that store global, available to all web components.
hub.addStore(TitleStore);

// Or define a store that can be used as an element to provide local state.
hub.addElement("title-store", TitleStore);

// Create a view that displays the title from the store.
const TitleView = View.define({
  // If setup can be async, does this remove the need for router preload?
  async setup(ctx, m) {
    const { title } = ctx.useStore(TitleStore);

    const { title } = await useStore(TitleStore);

    ctx.reload(); // Unrelated, but completely tears down and sets up the view again. Do we need this?

    return m("h1", title);
  }

  // TODO: Make setup async and have some other function to render while it's setting up.
  // Loading is active while setup returns a Promise and that promise is pending.
  loading() {
    return <h1>Loading...</h1>;
  }
});

// Define the view as a <title-view> element that will be rendered whenever you use that tag on the page.
hub.addElement("title-view", TitleView);

// Registers elements and stores, activating ones currently in the DOM.
hub.connect().then(() => {
  console.log("Hub elements are now registered.");
});
```

This will register the view as a web component that can be used on any HTML page where the script is included. Views loaded in this way can still access the built-in stores you would expect in a standard app (`http`, `router`, etc).

Custom elements will resolve stores in this order: Local (-> App, if used within an app) -> defineStore global.
Normal views used in an app will resolve Local -> App and don't have access to those defined with defineStore.

```html
<body>
  <title-view></title-view>

  <script src="./elements.js"></script>
</body>
```

One downside is that JSX is still going to require transpiling, so you need to use the `m` function to render if you're just dropping this script into a page.

## Known Issues

- As of this writing, web component tags used in an App will still use global stores instead of those of the app. This might be fine though, since you can still use the element class directly if you want to load it as a View rather than as a web component. Each invocation style lives in its own little world.
- Connecting the hub is async, and elements are registered last. This is so they have access to the stores that may have async setup functions. Depending on which stores are loaded, all custom elements may take a second to initialize.
