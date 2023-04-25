# Web Components

```jsx
import { Elements } from "@borf/browser";

const hub = new Elements();

// Create a store that holds a title.
function TitleStore() {
  return {
    title: "This is the Title",
  };
}

// Make that store global, available to all web components.
hub.addStore(TitleStore);

// Or define a store that can be used as an HTML element.
hub.addElement("title-store", TitleStore);

// Create a view that displays the title from the store.
async function TitleView(self) {
  // Loading is active while setup returns a Promise and that promise is pending.
  self.setLoader(m.h1("Loading..."));

  const { title } = self.useStore(TitleStore);

  return m.h1(title);
}

// Define the view as a <title-view> element that will be rendered whenever you use that tag on the page.
hub.addElement("title-view", TitleView);

// Registers elements and stores, activating ones currently in the DOM.
hub.connect().then(() => {
  console.log("Elements are now registered.");
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

## Known Issues

- As of this writing, web component tags used in an App will still use global stores instead of those of the app. This might be fine though, since you can still use the element class directly if you want to load it as a View rather than as a web component. App and Elements live in their own separate worlds.
- Connecting the hub is async, and elements are registered last. This is so they have access to any async stores. Depending on which stores are loaded, elements may take a second to initialize.