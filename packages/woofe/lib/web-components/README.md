# Woofe Web Components

Woofe components can be loaded as web components instead of through an app.

```jsx
import { Store, View } from "woofe";
import { defineStore, defineElement } from "woofe/web-components";

// Create a store that holds a title.
class TitleStore extends Store {
  setup(ctx) {
    return {
      title: "This is the Title",
    };
  }
}

// Make that store global, available to all web components.
defineStore(TitleStore);

// Or define a store that can be used as an element to provide local state.
defineElement("title-store", TitleStore);

// Create a view that displays the title from the store.
class TitleView extends View {
  // If setup can be async, does this remove the need for router preload?
  async setup(ctx, m) {
    const { title } = ctx.useStore(TitleStore);

    const { title } = await useStore(TitleStore);

    ctx.reload(); // Unrelated, but completely tears down and sets up the view again. Do we need this?

    return m("h1", title);
  }

  // TODO: Make setup async and have some other function to render while it's setting up.
  // Loading is active while setup returns a Promise and that promise is pending.
  loading(m) {
    return <h1>Loading...</h1>;
  }
}

// Define the view as a <title-view> element that will be rendered whenever you use that tag on the page.
defineElement("title-view", TitleView);
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

## TODO: Decorators

For whenever decorators finally get added to JS (or if you're using TS), the define functions should also double as decorators if you leave off the component argument at the end and preface them with @ above the component.

```tsx
import { Store, View } from "woofe";
import { defineStore, defineElement } from "woofe/web-components";

@defineStore() // Make it global.
@defineElement("title-store") // Define a <title-store> element.
class TitleStore extends Store {
  setup(ctx) {
    return {
      title: "This is the Title",
    };
  }
}

@defineElement("title-view") // Define a <title-view> element.
class TitleView extends View {
  setup(ctx, m) {
    const { title } = ctx.useStore(TitleStore);

    return m("h1", title);
  }
}
```

## Known Issues

As of this writing, web component tags used in a woofe app will still use global stores, not those of the app.

Also the async `setup` with `loading()` function scheme will be a little weird to pull off for Stores in web components. Elements may need to put themselves in some kind of queue to wait for certain stores to be registered before displaying.
