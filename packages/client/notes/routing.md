# Routing Notes

Router needs to support nested routes.

```js
const app = makeApp();

app.route("/example", ExampleLayout, function () {
  // Every route defined in this function is mounted at '/example/*' and rendered as children of an ExampleLayout.
  this.route("/users", UsersLayout, function () {
    // Every route defined in this function is mounted at '/example/users/*' and rendered as children of a UsersLayout.
    this.route("/", UsersList);
    this.route("/:id", UserDetails);
    this.route("/:id/edit", UserEdit);
  });

  this.route("/projects", Projects);

  this.redirect("*", PageNotFound);
});

app.redirect("*", "/example/users");
```

The code above defines these routes:

- `/example/users` -> ExampleLayout > UsersLayout > UsersList
- `/example/users/:id` -> ExampleLayout > UsersLayout > UserDetails
- `/example/users/:id/edit` -> ExampleLayout > UsersLayout > UserEdit
- `/example/projects` -> ExampleLayout > Projects
- `/example/*` -> ExampleLayout > PageNotFound
- `/*` -> (redirect to `/example/users`)

All routes are defined at the top level of the app. This way one global $route state could be provided by the @router service. Only one route can match at a time, and routes are always defined in only one place.

```js
// The whole app is rendered as children of an AppLayout
app.route("*", AppLayout, function () {
  this.route("/users", UsersList); // Display UsersList at '/users'
  this.route("/users/:id", UserDetails); // Display UserDetails at '/users/:id/
  this.route("/users/:id/edit", UserEdit); // Display UserEdit at '/users/:id/edit'

  this.route("/nested", NestedLayout, function () {
    this.route("/route", NestedRoute);
  });

  // Redirect to '/users' if no other sibling routes match
  this.redirect("*", "/users");
});

// This would generate the following routes object:
const routes = [
  // These routes are handled by the app's top level Outlet
  {
    path: "*",
    component: AppLayout,
    // These routes are handled by an Outlet that is the child of AppLayout
    // <AppLayout>
    //   <Outlet routes={these...} />
    // </AppLayout>
    routes: [
      {
        path: "/users",
        component: UsersList,
      },
      {
        path: "/users/:id",
        component: UserDetails,
      },
      {
        path: "/users/:id/edit",
        component: UserEdit,
      },
      {
        path: "/nested",
        component: NestedLayout,
        routes: [
          {
            path: "/route",
            component: NestedRoute,
          },
        ],
      },
      {
        path: "*",
        redirect: "/users",
      },
    ],
  },
];
```

```ts
// Each object in the array has this schema:
type Route = {
  path: string;
  component: Function | Object;
  routes?: Route[];
  redirect?: string;
};
```

The Outlet component takes an array of these route objects and renders them, creating a new Outlet for each `children` array.

- `app.route(path, component)` to render a component at a path
- `app.route(path, component, defineRoutes)` to render nested routes as children of the component

Then components can access the current route info and navigation on the `@router` service.

```js
function ExampleComponent($, self) {
  const { $route, $path, $params, $query, navigate, back, forward } = self.getService("@router");

  // Route path with param placeholders (like '/users/:userId/edit')
  $route.get();

  // Full path as it appears in the URL (like '/users/12/edit')
  $path.get();

  // Work with URL params
  $params.get("userId"); // Access URL params by :name
  $params.get("wildcard"); // Access matched content for '/*' fragment of route

  // Set params to change URL? Alternative way to redirect.
  $params.set((params) => {
    params.userId = 12;
  });

  // Update query params in URL: ?selected=some-tab&r=/users/5
  $query.set((query) => {
    query.selected = "some-tab";
    query.r = "/users/5";
  });

  // TODO: Support this syntax if state's value is an object?
  $query.set("selected", "some-tab");

  // Back and forward, just like clicking the buttons
  back();
  forward();

  // Navigate to another URL:
  navigate("/some/path");
  navigate($path.get(), "../edit"); // Supports multiple fragments with relative paths
}
```

## Outlet Ideas

Information routes have:

- their parent route
- their own matched route (matched against parent's wildcard value)
-

```js
$.routes((when, redirect) => {
  when("/", TestRoute);
  when("test/:id/*", TestRoute2, { ...attrs });
  redirect("*", "./");
});

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
