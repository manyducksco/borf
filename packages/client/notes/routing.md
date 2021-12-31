# Routing Notes

Router needs to support nested routes.

```js
const app = new App();

app
  .route(
    // wildcard indicates this route may have nested routes
    // using an outlet under a non-wildcard route will throw an error
    "/path/*",
    class extends Component {
      createElement($) {
        return (
          $.outlet()
            // paths in an outlet route are relative to the parent route
            .route(
              "first/*",
              class extends Component {
                createElement($) {
                  return $.outlet()
                    .route(":id", ViewComponent)
                    .route(":id/edit", EditComponent)
                    .route(":id/delete", DeleteComponent);
                }
              }
            )
            .route("second", SecondComponent)
        );
      }
    }
  )
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
