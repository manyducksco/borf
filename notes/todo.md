# TODO

Prepare for client v1.0

- [x] Remove `transitionOut` hook.
- [x] Move `loadRoute` to the router.
- [x] Implement `makeTransitions` helper.
- [ ] Add option to remount all layers when routes match.
- [ ] Figure out types for `makeGlobal` (inference of return type)
- [ ] Complete JSX element type definitions
- [ ] Add full doc comments to type definitions
- [ ] Refactor core views to put less between user code and the DOM

## Move `loadRoute` to router

I'm thinking of moving this to a `preload` hook on the route definition itself.

The current route definition syntax looks like this: (path, component, subroutes)

```jsx
app.route("/some/path", SomeComponent, (sub) => {
  sub.route("/foo", FooComponent);
  sub.route("/bar", BarComponent);
  sub.redirect("*", "./foo");
});
```

The new route definition syntax would support passing an object with additional options and callbacks in place of the subroutes function. This allows for handling preload at the route level. Route preloading only works at the route level anyway, so it doesn't make very much sense to have it be a lifecycle hook in a component. The new `preload` hook can resolve an object in order to pass preloaded data to the component as attributes.

```jsx
app.route("/some/path/:id", {
  remount: true,
  view: SomeView,
  preload: async (ctx) => {
    const { $params } = ctx.global("router");

    // Display this element until the promise resolves or until .show() is called with something else.
    ctx.show(<h1>NOW LOADING...</h1>);

    // Do some async loading thing.
    const loadedData = await loadData($params.get().id);

    // Resolve an object to be merged into SomeComponent's $attrs when connected.
    ctx.set({ loadedData });
  },
  subroutes: (sub) => {
    sub.route("/foo", FooComponent);
    sub.route("/bar", BarComponent);
    sub.redirect("*", "./foo");
  },
});
```

## Transitions

We need a helper for animated transitions. This object should wrap an element, act like an element itself, and handle any defined transitions.

```jsx
// Create reusable transitions.
const animated = makeTransitions({
  in: function (ctx) {
    // TransitionContext has:
    // - .node (the root DOM node of the wrapped element)
    // - .done()

    // Using something like popmotion.
    animate({
      from: 0,
      to: 1,
      type: "spring",
      onUpdate: function (latest) {
        ctx.node.style.opacity = latest;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
  out: function (ctx) {
    // Using CSS transitions.
    const handler = () => {
      ctx.node.classList.remove("animated-out");
      ctx.node.removeEventListener("transitionend", handler);
      ctx.done();
    };

    ctx.node.addEventListener("transitionend", handler);
    ctx.node.classList.add("animated-out");
  },
});

const Example = makeView((ctx) => {
  return (
    <ul>
      {ctx.repeat("list", ($item) => {
        // Call with an element to enable transitions.
        return animated(<li>{$item}</li>);
      })}
    </ul>
  );
});
```

## Make web components with woofe

Register a woofe view as a web component. This would be better as a separate import since it wouldn't see much use in a traditional woofe app, though it would technically be compatible.

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

// Create a view that displays the title from the store.
class TitleView extends View {
  setup(ctx, m) {
    const { title } = ctx.useStore(TitleStore);

    return m("h1", title);
  }
}

// Make that store global, available to all web components.
defineStore(TitleStore);

// Or define a store that can be used as an element to provide local state.
defineElement("title-store", TitleStore);

// Define the view as a <title-view> element that will be rendered whenever you use that tag on the page.
defineElement("title-view", TitleView);
```

This will register the view as a web component that can be used on any HTML page where the script is included. Views loaded in this way can still access the built-in stores you would expect in a standard app.

Custom elements will resolve stores in this order: Local (-> App, if used within an app) -> defineStore global.
Normal views used in an app will resolve Local -> App and don't have access to those defined with defineStore.

```html
<body>
  <title-store>
    <title-view></title-view>
  </title-store>

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
