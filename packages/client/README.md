# Woof

A web framework that aims to:

- Be easy to understand
- Make good solutions the obvious solutions (a.k.a. "pit of success")
- Not require a build system if you don't want to use one
- Run the minimal amount of logic to get the job done (including DOM updates)

## Install

```
npm i @manyducksco/woof
```

## What a good web framework should be

- Effortlessly keeps the DOM in sync with the data. You should never need to think about this.
- Guides you toward doing things correctly, especially when you don't know what that looks like.
  - Obvious solutions should be good solutions (a.k.a "Pit of Success")
- Solves all the everyday problems without stepping out of the framework:
  - Components
  - Routing
  - State management (components/local and services/global)
  - HTTP requests and caching

## Main doc sections and order

- hello world example
- state
- routing
- dolla
- components
- services
- testing

## Interesting Trivia

- Routes have to end with `*` to have sub-routes. `$.route()` will throw an error otherwise.
- `$` is only available in route handlers and a component's `createElement` method.

## A Woof App

The basic app structure starts with an App instance:

```js
import woof from "@manyducksco/woof";

import Logger from "./services/Logger.js";

import Counter from "./components/Counter.js";
import UserProfile from "./components/UserProfile.js";

const app = woof();

// Services are singletons that hold shared state and methods.
app.service("logger", Logger);

// Routes display content when the browser's URL matches.
app.route("/counter", Counter);

// Routes support named params and a wildcard at the end.
// A wildcard means that this route may have sub-routes.
app.route(
  "/users/:id/*",
  ($, { app, http, next }) => {
    // When the request is done, set some global state and continue to the next handler.
    http.get(`/api/users/${app.params.id}`).then(res => {
      app.cache.users[app.params.id] = res.body;
      app.cache.currentUser = app.params.id;
      next();
    });

    // Component is displayed from the time the handler is loaded until `next()` is called.
    return $("div")({ class: "loader" }, "Loading...");
  },
  ($, { app } => {
    const { currentUser, users } = app.cache;

    return $(UserProfile)({
      user: users[currentUser]
    });
  })
);

// Wildcard routes match anything that didn't match another route.
// Wildcards don't need to come last. You can register routes in any order.
app.route("*", ($, { app }) => {
  const logger = app.services("logger").prefix("Main Route");

  logger.log(`No page found at ${app.path}. Redirecting.`);
  app.navigate("/counter");
});

// Mount the app.
app.start("#app");

// render HTML for the given path to a string (for server side rendering)?
app.toString(path);
```

## Route handler functions

Multiple handler functions can be stacked on one route, activated when the previous handler calls `next()`. Handlers look like this:

```js
/**
 * Available items in handler:
 * - $: template function and helpers
 * - app: Global properties and state
 * - next: Function to continue to next handler
 * - http: HTTP client
 */

const handler = ($, { app, http, next }) => {
  app.title = "New Page Title"; // contains current page title; updates page title when set
  app.path; // (read only) current URL path
  app.route; // (read only) current matched route
  app.params; // (read only) params parsed from URL
  app.query; // (read only) query params parsed from URL
  app.cache; // mutable object to store arbitrary global variables

  app.navigate("/some/other/path", { replace: true }); // specific absolute path (with replace)
  app.navigate("relative/path"); // no leading slash -- navigate relative to current path
  app.navigate(-1); // back
  app.navigate(1); // forward

  // Get a reference to a service.
  const logger = app.services("logger");

  next(); // continue to next route in the stack with `next`

  // Create element templates with $(tag, attrs?):
  const div = $("div");
  const customDiv = $("div", {
    style: {
      backgroundColor: "red",
      color: "white",
    },
  });

  // takes an (optional) attributes object and any number of children
  // attributes will be merged with attributes passed to the constructor
  // children can be strings, falsy values (ignored), Component instances, or render functions
  const element = customDiv({ class: "a-class" }, "Child", () =>
    $("span")(" Child2 ")
  );
  // this creates: <div class="a-class">Child<span> Child2 </span></div>

  // components can be used in the same way by passing the class to $()
  // this binds special properties like the global 'app' object when the component is initialized
  // components can access `this.app`, `this.attributes` and `this.children` to get these values
  $(Component)({ ...attributes }, ...children);

  // The dolla function takes an optional second argument of default attributes.
  const element = $("div", { ...attributes });
  element(attributes, children); // merge these attributes with the defaults
  element(children); // use only the defaults

  // nested routes like this?
  // paths are automatically joined to the current app path

  $.route()
    .when("sub/route", handler)
    .when("sub/other", handler)
    .when("*", ($, { app }) => app.navigate("sub/route"));

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

## Reusable views with Component

You can make an entire app out of render functions, but Component offers an object with lifecycle methods and local state.

```js
import { Component, state } from "@manyducksco/woof";

/**
 * Injected items in Component:
 * - this.app: Global properties and state
 * - this.http: HTTP client
 */

class MyComponent extends Component {
  data = state(null);
  error = state(null);

  // render function - run once before `beforeConnect` and cleaned up after `disconnected`
  createElement($) {
    // access injected stuff from here
    const { app } = this;

    app.title = "This Page";
    const counter = app.services("counter");

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

  /*========================*\
  ||    Lifecycle Methods   ||
  \*========================*/

  created() {
    // Runs when the component object is first created
  }
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
    // NOTE: Components should probably clean up their HTTP client's listeners on disconnect
  }
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
```

## Shared state and logic with Service

Services are single instances of a class, registered on app, that can be used from any route handler or component.

```js
import woof, { Service, state } from "@manyducksco/woof";

const app = woof();

/**
 * Injected items in Service:
 * - this.app: Global properties and state
 * - this.http: HTTP client
 */

class Counter extends Service {
  count = state();

  created() {
    // gets called when the service is created
    this.count(0);
  }

  customMethod() {
    // you can also access injected properties from within a service, similar to components
    this.http;
    this.app;
  }
}

app.service("counter", Counter);

app.route("*", ($, { app }) => {
  // once registered, you can access the services in route functions with
  // `app.services(name)` or in components with `this.app.services(name)`.
  const counter = app.services("counter");

  counter.count();
  counter.count(7);
});

app.start("#app");
```

## Reactive state with `state()`

Woof has no virtual DOM, so any data that is going to change and be reacted to should be defined as a `state`.

```js
import { state } from "@manyducksco/woof";

// define a state starting with a value of 0
const counter = state(0);

counter(); // get the current value, currently 0

counter(5); // set the counter value to 5
counter(); // getting again will now return 5

// listen for changes
const cancel = counter((count) => {
  console.log(`Count is now ${count}`);
});

// state also comes with some helpers to create modified versions of a state
// cloned states take their value from the source, so they can't be called with a new value
const doubled = state.map(counter, (x) => x * 2);
const even = state.filter(counter, (x) => x % 2 === 0);

state.set(2);

doubled(); // returns 4
doubled(5); // throws an Error("State copies cannot be set.")
doubled((value) => {
  console.log(value);
});
```

## Advanced setup

```js
import woof from "@manyducksco/woof";

const app = woof();

// Use `.init(fn)` to configure the app before it starts.
// If the function returns a Promise, the app will wait for resolved before starting
app.setup(async function ({ app, http }) {
  http.use((ctx, next) => {
    // Configure some HTTP middleware
  });

  // Preload some data from an API
  const data = await http.get("/prefetched/data");

  app.cache.data = data;
});

app.start("#app");
```

## Ideas

- Implement core framework parts as services that you can override
  - $dolla provider
  - http client
  - routing
  - cache (might be pointless if you can implement your own services)

This keeps structure consistent and modular. Easy to swap out services or add new ones.

### All attributes are states?

I had to implement attr() using states to make the views reactive in the testbed. Consider automatically making all attributes into states if they aren't already.

Pass through functions as-is, but wrap anything else in a state. This guarantees components are written with changing attributes in mind.

To go with that, consider changing `app` object props to be states as well, to make things consistent and allow changing routes without recreating elements. This makes the naming of `app.services()` kind of weird.

### Cleaning up listeners

Need to somehow proxy attributes and `app` object so any listeners created within createElement get removed when the component is disconnected. Might need to proxy states on services too.

### Filter/map changes

Returning undefined in a state.map to filter is convenient, but causes confusing non-running code when you're mapping things in real life. You have to go in and fall back to null if you want it to set. I don't feel like this is expected behavior from a map.
