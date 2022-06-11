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

  this.route("*", PageNotFound);
});

app.redirect("*", "/example/users");

// Creates the following flat structure. Nested components are defined as layers.
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

All routes are defined at the top level of the app. This way one global $route state could be provided by the @router service. Only one route can match at a time, and routes are always defined in only one place.

```js
import { makeApp } from "@woofjs/client"; // client-specific
import { makeApp } from "@woofjs/server"; // server-specific

import { v, each, when, unless, watch, bind } from "@woofjs/view"; // client or server
import { makeState, mergeStates, isState } from "@woofjs/state"; // client or server

// Component is called with `self` as this, so you can do this?
function Component($attrs) {
  const { $route, $params } = this.getService("@router");

  const someValue = $attrs.get("someValue");
  const $inputValue = makeState("");

  this.beforeConnect(() => {
    // Do callback.
  });

  v("input", { type: "text", value: bind($inputValue) });

  <input type="text" value={bind($inputValue)} />;

  return when($condition, h("h1", "Yo!"));

  return (
    <div>
      {each($items, function Item($attrs) {
        this.key = $attrs.map("@index");

        // return v("h1", $attrs.map("@value"));

        return <h1>{$attrs.map("@value")}</h1>;
      })}
    </div>
  );
}

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
    // The question is how to get the outlets to respond to changes at the top level.
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
function ExampleComponent($attrs, self) {
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
