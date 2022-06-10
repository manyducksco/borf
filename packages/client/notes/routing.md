# Routing Notes

Router needs to support nested routes.

```js
const app = makeApp();

// wildcard indicates this route may have nested routes
// using an outlet under a non-wildcard route will throw an error
app.route("/path/*", function ($, self) {
  // paths in an outlet route are relative to the parent route
  return $.router((self) => {
    self.route("first/*", function ($) {
      return $.router((self) => {
        self.route(":id", ViewComponent);
        self.route(":id/edit", EditComponent);
        self.route(":id/delete", DeleteComponent);
      });
    });

    self.route("second", SecondComponent);
  });
});

app.route("*", PageNotFoundComponent);
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

A component's $route contains the full path (nested paths joined), all params down that route tree.

```js
function ($, self) {
  const { navigate } = self.getService("@router");

  navigate(self.$route.get("path"), "../create");

  return $.router((self) => {
    self.route("/:userId/*", ($, self) => {
      return <div></div>
    })

    self.route("/:userId/edit", ($, self) => {
      return <div></div>
    })
  });
}

```

Maybe it would be better and easier to require all routes to be defined at the top level of the app. This way one global $route state could be provided by the @router service. Only one route can match at a time, and routes are always defined in only one place.

```js
// The whole app is rendered as children of an AppLayout
app.route("*", AppLayout, ({ route, redirect }) => {
  route("/users", UsersList); // Display UsersList at '/users'
  route("/users/:id", UserDetails); // Display UserDetails at '/users/:id/
  route("/users/:id/edit", UserEdit); // Display UserEdit at '/users/:id/edit'

  // Redirect to '/users' if no other sibling routes match
  redirect("*", "/users");
});

// This would generate the following routes object:
const routes = [
  // These routes are handled by the app's top level Outlet
  {
    path: "*",
    component: AppLayout,
    // These routes are handled by an Outlet that is the child of AppLayout
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
