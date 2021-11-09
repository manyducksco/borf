# Woof

A web framework with these goals:

- Made up of individual tools that compose well together
- Doesn't require any transpiling or build system
- Runs the minimal amount of logic to get the job done (including DOM updates)

## Install

```
npm i @manyducksco/woof
```

## What a good web framework should be

- Easy to think about. _What are all the pieces and how are they related?_
- Effortlessly keeps the DOM in sync with the data. You should never need to think about this.
- Guides you toward doing things correctly, especially when you don't know what that looks like.
  - Conventions should steer you toward good solutions (a.k.a "Pit of Success")
- Solves all the everyday problems without stepping too far out of the framework:
  - Views
  - Routing
  - State management
  - HTTP requests and caching

## A Woof App

The basic app structure starts with an App instance:

```js
import woof from "@manyducksco/woof";

const app = woof();

// init function is run before the app is started
// use it to set up middleware, preload caches, etc.
// if it is async, the app won't be started until the promise resolves
app.init(async ({ app, http }) => {
  http.use((ctx, next) => {
    const url = new URL(ctx.url);

    if (/* is local API call */ && app.cache.authToken) {
      ctx.headers["authorization"] = `Bearer ${app.cache.authToken}`;
    }

    await next();
  });

  const res = await http.get("/api/preload");

  if (res.isSuccess) {
    app.cache.preloaded = res.data;
  }

  // Remove loading screen embedded in HTML
  const loader = document.querySelector("#loader");
  loader.parentNode.removeChild(loader);
});

app.service("name", Service);

// handlers are functions that return a Component or null
// you can also pass a component directly
app.route("some/:id", ...handlers);

app.route(
  "other/path",
  ({ app, http, next }) => {
    console.log("one");

    http.get("/api/example").then((res) => {
      app.cache.exampleData = res;
      next();
    });
  },
  Component
);

app.start("#app");
```

Multiple handler functions can be stacked on one route, activated when the previous handler calls `next()`. Handlers look like this:

```js
const handler = ({ $, app, next, http }) => {
  app.title = "New Page Title"; // contains current page title; updates page title when set
  app.path; // (read only) current URL path
  app.route; // (read only) current matched route
  app.params; // (read only) params parsed from URL
  app.query; // (read only) query params parsed from URL
  app.cache; // mutable object to store arbitrary data globally (auth?)

  app.navigate("/some/other/path", { replace: true });

  const service = app.services("name");

  next(); // continue to next route in the stack with `next`

  // create templates with $ object:
  const div = $("div"); // creates an element constructor

  // takes an (optional) attributes object and any number of children
  // children can be strings, falsy values (ignored), Component instances, or render functions
  const element = div({ class: "some-class" }, "Child", () => "Child2");

  // components can be used in the same way by passing the class to $()
  // this binds special properties like the global 'app' object when the component is initialized
  // components can access `this.app`, `this.attributes` and `this.children` to get these values
  $(Component)({ ...attributes }, ...children);

  // nested routes like this?
  // paths are automatically joined to the current app path
  $.router()
    .route("sub/route", handler)
    .route("sub/other", handler)
    .route("*", ({ app }) => app.navigate("sub/route"));

  // conditionals
  const maybe = $.if(
    condition,
    () => $("span")("condition is truthy"),
    () => $("span")("condition is falsy") // optional else condition
  );

  // lists
  const list = $.map(
    items,
    (item) => item.id,
    (item) => {
      return $("li")({ class: "list-item" }, item.name);
    }
  );

  return $("div")(
    {
      class: "handler-div",
      other: "4",
    },
    $("ul")(
      $.map(
        something,
        (x) => x.id,
        (x) => $("li")({})
      )
    )
  );
};
```

You can make an entire app out of render functions, but Component offers an object with lifecycle methods and local state:

```js
class MyComponent extends Component {
  data = observable(null);
  error = observable(null);

  // render function - run once before `beforeConnect` and cleaned up after `disconnected`
  init($) {
    // access injected stuff from here
    const { app } = this;

    app.title = "This Page";
    const svc = app.services("name");

    return $.if(
      this.error,
      () => $("h1")(this.error),
      () =>
        $("div")(
          {
            ...this.attributes,
            class: ["my-container", this.attributes.class],
          },
          $("span")(
            "This is a component, also: ",
            $.text(this.data, "loading...")
          ),
          ...this.children
        )
    );
  }

  // lifecycle methods
  beforeConnect() {
    // if data is cached, cached data is returned and a new request is sent to update it behind the scenes
    // if the new data is different the listen function will be called again
    // the HTTP client implements its own Promise-compatible methods, so .then is the same as .listen but only gets the first change
    this.http.get("/api/component-data").then((res) => {
      if (res.ok) {
        this.data(res.body);
      } else {
        this.data(null);
        this.error(res.body.message);
      }
    });
  }
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
```
