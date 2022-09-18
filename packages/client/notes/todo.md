# TODO

Prepare for v1.0

- [x] Remove `transitionOut` hook.
- [x] Move `loadRoute` to the router.
- [ ] Implement `makeTransitions` helper.
- [ ] Add option to remount all layers when routes match.
- [ ] Figure out types for `makeGlobal` (return type inference)

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
