# Routing Notes

Routes are defined in the AppConfig object.

```jsx
const Example = makeApp({
  routes: [
    {
      path: "/example",
      view: ExampleLayout,
      routes: [
        {
          path: "/users",
          view: UsersLayout,
          routes: [
            { path: "/", view: UsersList },
            { path: "/{id:number}", view: UserDetails },
            { path: "/{id:number}/edit", view: UserEdit },
          ],
        },
        { path: "/projects", view: Projects },
        { path: "*", view: PageNotFound },
      ],
    },
    {
      // Nested routes without a layout view.
      path: "/with-nested",
      routes: [
        { path: "/nested-one", view: () => <span>One</span> },
        { path: "/nested-two", view: () => <span>Two</span> },
      ],
    },
    { path: "*", redirect: "/example/users" },
  ],
});

// Each object in the routes array has this schema:
type RouteConfig = {
  path: string,
  view: ViewSetupFn | View,
  routes?: RouteConfig[],
  redirect?: string,
};
```

Routes are passed in nested form, but flattened into layers by the router. Layers are essentially an array of the `view`s from each level of nesting in a flat array. The next layer is mounted as a child of the previous layer when that route matches.

```js
// Creates the following flat structure. Nested views are defined as layers.
[
  {
    path: "/example/users",
    layers: [
      { id: 1, component: ExampleLayout },
      { id: 2, component: UsersLayout },
      { id: 3, component: UsersList },
    ],
  },
  {
    path: "/example/users/:id",
    layers: [
      { id: 1, component: ExampleLayout },
      { id: 2, component: UsersLayout },
      { id: 4, component: UserDetails },
    ],
  },
  // When navigating to ./edit layers 1 and 2 are unchanged, but layer 4 gets disconnected and layer 5 gets connected.
  {
    path: "/example/users/:id/edit",
    layers: [
      { id: 1, component: ExampleLayout },
      { id: 2, component: UsersLayout },
      { id: 5, component: UserEdit },
    ],
  },
  {
    path: "/example/projects",
    layers: [
      { id: 1, component: ExampleLayout },
      { id: 6, component: Projects },
    ],
  },
  {
    path: "/example/*",
    layers: [
      { id: 1, component: ExampleLayout },
      { id: 7 component: PageNotFound },
    ]
  },
  {
    path: "/*",
    redirect: "/example/users"
  }
];
```

Algorithm:

1. Find new route match
2. If redirect, choose new match based on redirect path. Repeat until non-redirect route is found.
3. Diff layers; disconnect at first layer that doesn't exist at the corresponding index, connect new layer.

How do we connect? Layers are created with an Outlet component as their child. The outlet somehow receives the component it's supposed to render so it can be swapped out without changing the parent layer itself.

Needs:

- Validate that redirect paths exist at app startup
- Allow Outlets to handle their own levels
- Add wildcard to the end of routes that have subroutes, use wildcard value to match subroute paths

The code above defines these routes:

- `/example/users` -> ExampleLayout > UsersLayout > UsersList
- `/example/users/:id` -> ExampleLayout > UsersLayout > UserDetails
- `/example/users/:id/edit` -> ExampleLayout > UsersLayout > UserEdit
- `/example/projects` -> ExampleLayout > Projects
- `/example/*` -> ExampleLayout > PageNotFound
- `/*` -> (redirect to `/example/users`)

All routes are defined at the top level of the app. This way one global $route state could be provided by the `router` store. Only one route can match at a time, and routes are always defined in only one place.

```ts
import { makeState, View } from "@woofjs/client";

// View is called with `self` as this, so you can do this?
class Example extends View {
  setup(ctx, m) {
    const router = ctx.useStore("router");

    // Route path with param placeholders (like '/users/{userId}/edit')
    router.$route.get();

    // Full path as it appears in the URL (like '/users/12/edit')
    router.$path.get();

    // Work with URL params
    router.$params.get("userId"); // Access URL params by :name
    router.$params.get("wildcard"); // Access matched content for '/*' fragment of route

    // Update query params in URL: ?selected=some-tab&r=/users/5
    router.$$query.update((query) => {
      query.selected = "some-tab";
      query.r = "/users/5";

      // TODO: Automatically URL-encode? $$query would always hold decoded versions.
    });

    // Back and forward, just like clicking the buttons
    router.back();
    router.forward();

    // Navigate to another URL:
    router.navigate("/some/path");
    router.navigate($path.get(), "../edit"); // Supports multiple fragments with relative paths
  }
}
```
