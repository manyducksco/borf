# TODO

Prepare for v1.0

- Remove all unnecessary features
  - [x] String selectors in state get and map (functions only)
  - [ ] TransitionOut lifecycle hook
  - [x] Deprecated `watchState` in components now that `subscribeTo` exists
  - [ ] loadRoute lifecycle hook; this can make navigation feel slower
    - Move out of component and into router
  - [x] `this` binding in service and component functions; take the context as the first parameter instead
    - This gives more than one way to do the same thing, complicating explanations.
- Reconsider if proxy states are a good idea or indicative of some design flaw in the framework.
  - Proxy states are hard to explain.
  - They are used in Quack to point a single state to multiple other states over time as route params change.
  - Recreating a route component whenever the router matches anything (even the same route) would help prevent the need for this.

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
app.route("/some/path/:id", SomeComponent, {
  preload: (ctx) => {
    return new Promise((resolve) => {
      const { $params } = ctx.services.router;

      // Display this element until the promise resolves or until .show() is called with something else.
      ctx.show(<h1>NOW LOADING...</h1>);

      // Do some async loading thing.
      const loadedData = await loadData($params.get((p) => p.id));

      // Resolve an object to be merged into SomeComponent's $attrs when connected.
      return { loadedData };
    });
  },
  subroutes: (sub) => {
    sub.route("/foo", FooComponent);
    sub.route("/bar", BarComponent);
    sub.redirect("*", "./foo");
  },
});
```
