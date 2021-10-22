# Router

Mounts pages when the browser's URL changes.

Problems:

- Need a way to structure pages for a single page app
- Need a way to define nested routes that render inside of another component

```js
Router.map(function () {
  // '.route(string, function)' defines a nested route
  this.route("notes", function () {
    // '.route(string, object)' defines an endpoint that mounts a component - access this at '/notes/new'
    this.route("new", { component: ASDF });

    this.route(":id", {
      preload: async () => {},
      component: ASDF,
    });
  });
});

function SomeComponent(props) {
  const { preloaded, path } = props;
}

const router = new Router({
  basePath: "",
  routes: [
    {
      path: "notes",
      component: SomeComponent,
    },
    {
      path: "notes/new",
      component: SomeComponent,
    },
    {
      path: "notes/:id",
      preload: async () => {
        // whatever this resolves to is passed as 'preloaded' in the component's props
      },
      component: SomeComponent,
      fallback: LoadingComponent, // shows while route is preloading
    },
  ],
});

// start listening to route changes
router.listen({
  bindLinks: true, // hijack clicks on <a> tags with local hrefs
});

// Router is an element, so you can mount it or pass it in as a child of another element
router.mount(document.getElementById("#app"));

// Router.link() returns a decorated <a> tag that changes the page history instead of redirecting
Router.link({
  href: "/notes/5",
  class: "super-link",
});
```

```js
// Global state object
interface Globals {
  title: State;
  route: {
    switch: (routes) => Component,
  };
}
```

Routes take a path and then any number of route functions. Route functions take the route object, a `next` function and a third `data` parameter that is whatever the previous function passed when calling `next`.

If the route function returns nothing the previous route will stay mounted until `next` is called. If the route function returns a Component, that component will be mounted when the route function is called and unmounted when `next` is called. Several components can be chained together like middleware to set up analytics, fetching, loading screens or whatever. You could probably build a text adventure with chained route functions and creative redirects.

```js
app.route(
  "/some/:id",
  (route, next) => {
    fetch(`/api/example/${route.params.id}`)
      .then((res) => res.json())
      .then(next);

    return LoaderComponent();
  },
  (route, next, data) => {
    // data is the value the previous function called `next` with

    if (data.userIsAdmin) {
      next();
    } else {
      route.redirect("/other/page");
    }
  },
  component
);
```

Nested routes can be done with the route object's `switch` function. This takes an array of route arrays which follow the same pattern of one path string followed by one or more route functions.

```js
app.route("/test", (route) => {
  return E("div", {
    children: [
      E("h1", {
        children: ["Persistent Content"],
      }),

      E("p", {
        children: [
          "Subroutes will be rendered below but this content will remain unchanged.",
        ],
      }),

      route.switch([
        ["/edit", routeFunction],
        ["/create", routeFunction],
      ]),
    ],
  });
});
```
