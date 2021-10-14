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
