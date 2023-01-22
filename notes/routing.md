# Routing Notes

Router needs to support nested routes.

```js
const Example = makeView({
  name: "Example",
  about: "An example view.", // About text is picked up in woofe/viewer
  attributes: {
    value: {
      type: "string",
      about: "A string value.",
      default: "The Value",
    },
  },
  setup: (ctx) => {
    const name = ctx.global("name");

    const x = makeSpring(0);

    ctx.animateIn(async () => {
      // Runs just after view is connected.
      await x.to(100);
    });

    ctx.animateOut(async () => {
      // Runs before view is disconnected.
      await x.to(0);
    });

    return (
      <h1 style={{ transform: x.as((x) => `translateX(${x}px)`) }}>
        {name.$value}
      </h1>
    );
  },
});
```

```js
const ExampleGlobal = makeGlobal((self) => {});

const ExampleGlobal = makeGlobal({
  name: "Example",
  setup: (ctx) => {
    return {
      value: 5,
    };
  },
});

const ExampleLocal = makeLocal({
  name: "Example",
  attributes: {
    initialValue: {
      type: "number",
      default: 0,
    },
  },
  setup: (ctx) => {
    const initialValue = ctx.attrs.get("initialValue");
    const $$value = makeState(initialValue);

    return {
      $value: $$value.readable(),
      increment: () => {
        $$value.update((x) => x + 1);
      },
      decrement: () => {
        $$value.update((x) => x - 1);
      },
    };
  },
});
```

## App

```js
// The simplest app. No globals or routing.
const Hello = makeApp(() => {
  return <h1>Hello World!</h1>;
});

Hello.connect("#app");

// Top level outlet renders an easter-egg placeholder without routes.
const Hello = makeApp((ctx) => ctx.outlet());
const Hello = makeApp(); // Equivalent to above

const Hello = makeApp({
  // Use preload to run async code before the route is connected. Usually to fetch data.
  // If `preload` returns an object, its values are passed as attributes to the view.
  preload: async (ctx) => {
    const http = ctx.global("@http");
    const res = await http.get("/api/data");

    return { data: res.body };
  },

  view: (ctx) => {
    // This view function is equivalent to not passing one.
    return ctx.outlet(); // Outlet now renders route content.
  },

  routes: [
    // Routes become children of sibling view when their route fragment matches the current URL.
    // Only one route per `routes` array can be mounted at a time. Infinite nesting is supported.
    { path: "/hello", view: () => <h1>Hello World!</h1> },
    { path: "*", redirect: "/hello" },

    // Full route object example:
    {
      // Path is always required.
      path: "/example",

      // URL to redirect to when this path is matched.
      redirect: "/elsewhere",

      // Preloads, configures and returns initial attributes for `view` before the view is connected.
      // TODO: Figure out if this works with redirects. Preloading before a redirect seems like it could be useful.
      preload: async (ctx) => {
        // What happens to attributes when you preload before a redirect? // Do they get passed to the view at the redirect?
        return { attribute: "value" };
      },

      // Defines the view inside which routes are displayed. Not allowed when `redirect` is passed.
      view: (ctx) => ctx.outlet(),

      // Defines the routes to render into the view's outlet. Not allowed when `redirect` is passed.
      routes: [
        /* ... */
      ],
    },
  ],
});

// NOTE: Could try initializing globals on demand when accessed from other globals during the init process.
// This could possibly eliminate any kind of ordering issue, but not a circular dependency.

// Define all your routes upfront. Easier to see the structure of your whole app from one place.

const Hello = makeApp({
  globals: [{ name: "data", global: SomeGlobal }],
  view: (ctx) => {
    const { $name } = ctx.global("data");
    return <span>Hello {$name}!</span>;
  },
});

// Arrays of objects style (most explicit):
const Quack = makeApp({
  debug: {
    filter: "*", // Print everything
    log: false, // Skip logs
    warn: true, // Print warnings
    error: true, // Print errors
  },
  router: {
    hash: true,
  },
  globals: [
    { name: "name", global: SomeGlobal },
    { name: "other", global: SomeOtherGlobal },
  ],
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

// Note: route parsing
// `/{id:number}/edit` will only match where the `id` fragment is a numeric string, and the param will be parsed into a number.

Quack.connect("#app").then((ctx) => {
  // After route is matched and app is visible.
});

Quack.disconnect().then((ctx) => {
  // Do cleanup
});

const activeLayers = [
  {
    id: 1,
    component: ExampleLayout,
    outlet: {},
  },
  {
    id: 2,
    component: UsersLayout,
    outlet: {},
  },
];
```

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

All routes are defined at the top level of the app. This way one global \$route state could be provided by the @router service. Only one route can match at a time, and routes are always defined in only one place.

```js
import { makeState, v, when, repeat, bind } from "@woofjs/client";

// Component is called with `self` as this, so you can do this?
function Component($attrs) {
  const { $route, $params } = this.service("router");

  const someValue = $attrs.get("someValue");
  const $inputValue = makeState("");

  this.beforeConnect(() => {
    // Do callback.
  });

  v("input", { type: "text", value: bind($inputValue) });
  <input type="text" value={bind($inputValue)} />;

  return when($condition, v("h1", "Yo!"));

  return v("div", [
    repeat($items, function Item($attrs) {
      return v("h1", $attrs.map("value"));
    }),
  ]);
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
  const { $route, $path, $params, $query, navigate, back, forward } =
    self.getService("@router");

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

## Connecting views

The `v` function is used in components to render DOM elements and other components. Once the component function has been called to set up the component, the views need to be given the getService() function so their components can access it. How does this happen?

```js
function Component() {
  return v("div", [
    repeat($items, function Item($attrs) {
      return v("h1", $attrs.map("value"));
    }),
  ]);
}

const view = Component();

// Init the returned window, which will in turn init each child window.
view.init({ getService });
```

A component is a function that returns `null`, a DOM node, or a view. If it's a view, the view is initialized immediately after the component function is called. Views, when initialized, initialize their children.
