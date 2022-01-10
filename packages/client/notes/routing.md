# Routing Notes

Router needs to support nested routes.

```js
const app = makeApp();

// wildcard indicates this route may have nested routes
// using an outlet under a non-wildcard route will throw an error
app
  .route("/path/*", function ($, self) {
    return (
      // paths in an outlet route are relative to the parent route
      $.outlet()
        .route("first/*", function ($) {
          return $.outlet()
            .route(":id", ViewComponent)
            .route(":id/edit", EditComponent)
            .route(":id/delete", DeleteComponent);
        })
        .route("second", SecondComponent)
    );
  })
  .route("*", PageNotFoundComponent);
```

The code above defines these routes:

- `/path/first/:id` -> ViewComponent
- `/path/first/:id/edit` -> EditComponent
- `/path/first/:id/delete` -> DeleteComponent
- `/path/second` -> SecondComponent
- `/*` -> PageNotFoundComponent

## How does matching work?

We don't want to unmount and remount everything each time the route changes. Nested outlets should do a cascading match each time the route changes, swapping their route only if their segment has changed. A change in param values is considered the same route, but the params object on $.route will be updated. Params is a state, so any interested elements should already be listening for those changes.

A new dolla instance is created at each route boundary. I am using route boundary to refer to the top level router and all outlets. That route needs to be updated in the same dolla instance each time a match is done. Maybe the dolla constructor should export a function to run a match. The routing contexts create it, so they could store the function and call it when they update. And it just cascades down through each outlet.

## Do params cascade?

No. Unless we find a reason to need it I think we should keep params local. Each $.route should only contain params that matched in that route segment.

## Outlet Ideas

```js
$.outlet({
  // Grouped routes get joined like "test/edit", "test/:id/details" and matched in this outlet.
  // If value is an object, assume a route map. If value is a function, assume a component.
  // If value is a string, assume a redirect path.
  "/": ($) => $("div")("default"),
  "/test/*": {
    "/edit": ($) => $("h1")("edit"),

    "/delete": TestDelete, // or pass a standalone component

    // or pass a path for redirect
    "/:id/absolute": "/chunk1", // redirect relative to app
    "/:id/relative": "../chunk2", // redirect relative to this's parent's "/chunk2", just like a file path
    "/:id/outlet-relative": "chunk1", // redirect relative to this outlet
  },
  "/chunk1": ($) => $("h1")("This is the chunk1 page"),
  "/chunk2": ($) => $.text("HELLO CHUNK2"),
})

$.outlet(
  // Takes non-constructed dolla and passes route component as a child (needs reactive $children then?)
  $(CustomOutlet, {
    /* attrs */
  }),
  {
    /* routes */
  }
),
```
