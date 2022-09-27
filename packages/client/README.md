# (🐕🖥) @woofjs/client

Front end routing, components and state for dogs. 🐕

## Table of Concepts

1. [Routing](#routing)
2. [State](#state)
3. [Views](#views)
4. [Globals](#globals)

Outline for future guide:

- Creating an app
- Routing
  - Route matching
  - Nested routes
  - Preloading data for routes
- State
  - State methods (get, set, merge, nuke, observe)
  - Bindings (readable, writable)
- Views
  - State overview
  - Accessing globals
  - JSX / h
  - Binding data to DOM elements
  - Binding data to nested components
  - Template helpers (when, unless, repeat, watch)
- Globals
  - State overview

Exports four functions:

- makeApp
- makeGlobal
- makeView
- makeTransitions

## Hello World

```js
import { makeApp } from "@woofjs/client";

// Create a new woof app.
const app = makeApp();

// Display a <h1>Hello World</h1> at the root.
app.route("/", function (ctx, h) {
  return h("h1", "Hello World");
});

// Redirect any other URL back to root.
app.redirect("*", "/");

// Display this app inside the element with an `id` of "app"
app.connect("#app");
```

## Routing

At the top level, woof determines what view to display using routes. Routes "match" when the pathname of the
current URL fits a pattern. When a route matches, that route's view is displayed.

You'll notice that even a simple Hello World requires us to set up a route. Routing is central to what the web is. By
following this convention several things users expect from a web app will just work out of the box; back and forward
buttons, sharable URLs, bookmarks, etc.

Routing in Woof is heavily inspired by [choo.js](https://www.choo.io/docs/routing)
and [@reach/router](https://reach.tech/router/).

### Route Matching

Route strings are a set of fragments separated by `/`. These fragments are of three types.

- Static: `/this/is/static` and will match only when the route is exactly `/this/is/static`.
- Dynamic: `/users/:id/edit` will match anything that fits the static parts of the route and stores the parts beginning
  with `:` as named params. This can be anything, like `/users/123/edit` or `/users/BobJones/edit`. You can access these
  values inside the view.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that as a `wildcard`
  param. Wildcards must be at the end of a route.

```js
app.route("users/:id", function (ctx, h) {
  // Get route params from router.
  const { $params } = ctx.global("router");

  // Get the live value of :id with '.map()'.
  const $id = $params.to((p) => p.id);

  // Render it into a <p> tag. The ID portion will update if the URL changes.
  return h("p", "User's ID is ", $id);
});
```

> TODO: Describe nested routing

## State

In a woof app, there are two types of stateful objects; [views](#views) and [globals](#globals). These two share some common methods for storing
variables in _state_ and creating observable bindings. Views wire up those bindings to DOM nodes. Globals can keep shared
state by exporting bindings of their own for use in many views.

When the values stored in state change, anything observing those bindings is immediately notified and updated to match.

```js
import { makeView } from "@woofjs/client";

const Timer = makeView((ctx, h) => {
  ctx.defaultState = {
    seconds: 0,
  };

  function increment() {
    ctx.set("seconds", (value) => value + 1);
  }

  function reset() {
    ctx.set("seconds", 0);
  }

  // Increment once per second after the window is connected to the DOM.
  ctx.afterConnect(function () {
    setInterval(increment, 1000);
  });

  const $seconds = ctx.readable("seconds");

  return h("div", [
    h("input", { type: "text", value: $sections, disabled: true }),
    h("button", { onclick: reset }, "Reset Counter"),
  ]);
});
```

## Views

Views are reusable modules with their own markup and logic. You can define a view once and reuse it as many
times as you need. Views can take attributes that set their default state and establish data bindings.

```jsx
const Example = makeView((ctx, h) => {
  ctx.defaultState = {
    title: "Default Title",
  };

  const $title = ctx.readable("title");

  return h("div", [
    //
    h("h1", $title),
    h("p", "This is a reusable view."),
  ]);
});

// Views can be mounted directly on a route.
app.route("example", Example);

// They can also be used inside another window.
app.route("other", (ctx, h) => {
  return h("div", [
    // Pass state as attributes.
    h(Example, { title: "In Another View" }),
  ]);
});
```

### View Context

Views receive a context object they may use to translate state and lifecycle into DOM nodes.

```js
function htmlpers(h) {
  return {
    get a(...args) {
      return h("a", ...args);
    },
    get h1(...args) {
      return h("h1", ...args);
    },
    ...
  };
}

// Hypothetical function to generate factory functions for each HTML tag.
const { div, h1, p } = htmlpers(h);

return div(
  //
  h1({ class: "heading" }, "Title"),
  p("This is the paragraph."),
  h(SomeView, { value: 5 })
);


const Example = makeView(function (ctx, h) {
  // Access globals by the name they were registered under.
  const global = ctx.global("name");

  /*=================================*\
  ||             Logging             ||
  \*=================================*/

  ctx.name = "Example"; // Prefix messages in the console to make tracing easier at a glance.
  ctx.log("Something happened.");
  ctx.warn("Something happened!");
  ctx.error("SOMETHING HAPPENED!!!!");

  /*=================================*\
  ||              State              ||
  \*=================================*/

  // Set the default values for this window's state.
  ctx.defaultState = {
    title: "The Default Title",
  };

  const title = ctx.get("title");
  const $title = ctx.readable("title");
  const $$title = ctx.writable("title");

  ctx.set("title", "New Title");
  ctx.set({
    title: "Newer Title",
  });

  // Runs a callback function each time a state changes (or any observable emits a value).
  ctx.observe($title, (title) => {
    console.log("title attribute changed to " + title);
  });

  /*=================================*\
  ||            Lifecycle            ||
  \*=================================*/

  ctx.isConnected; // true if window is connected

  ctx.beforeConnect(() => {
    // Runs when the window is about to be (but is not yet) added to the page.
  });

  ctx.afterConnect(() => {
    // Runs after the window is added to the page.
  });

  ctx.beforeDisconnect(() => {
    // Runs when the window is about to be (but is not yet) removed from the page.
  });

  ctx.afterDisconnect(() => {
    // Runs after the window is removed from the page.
  });

  /*=================================*\
  ||      Rendering & Children       ||
  \*=================================*/

  // Render children inside a `<div>`
  return h("div", ctx.outlet());
});
```

### Templating

```jsx
const Example = makeView(function (ctx, h) {
  return h("section", [
    h("h1", "Item List"),
    h("p", { style: "color: red" }, "Below is a list of items."),
    h("ul", [
      h("li", "Item 1"),
      h("li", { class: "active" }, "Item 2"),
      h("li", "Item 3"),
      h("li", "Item 4"),
      h("li", "Item 5"),
      h("li", "Item 6"),
    ]),
  ]);
});
```

That view renders the following HTML.

```html
<section>
  <h1>Item List</h1>
  <p style="color: red">Below is a list of items.</p>
  <ul>
    <li>Item 1</li>
    <li class="active">Item 2</li>
    <li>Item 3</li>
    <li>Item 4</li>
    <li>Item 5</li>
    <li>Item 6</li>
  </ul>
</section>
```

#### Using JSX

Woof supports JSX, so if you want to write your views as HTML to begin with you totally can. However, it's
important to understand how `h` works because that's ultimately what the JSX compiles down to. JSX is simply an
alternate syntax for `h`.

> Note that Woof uses a `class` attribute like HTML rather than `className` like React.

```jsx
const Example = makeView(function (ctx) {
  return (
    <section>
      <h1>Item List</h1>
      <p style="color: red">Below is a list of items.</p>
      <ul>
        <li>Item 1</li>
        <li class="active">Item 2</li>
        <li>Item 3</li>
        <li>Item 4</li>
        <li>Item 5</li>
        <li>Item 6</li>
      </ul>
    </section>
  );
});
```

### Using views

```js
const Example = makeView((ctx, h) => {
  return h(Subview);
});

const Subview = makeView((ctx, h) => {
  return h("h1", "Hello from inside another window!");
});
```

When using subviews, you can pass them attributes just like you can with HTML elements. The Example views in
the following code will display `<h1>Hello world!</h1>`.

```js
const Example = makeView((ctx, h) => {
  return h(Subview, { name: "world" });
});

const Subview = makeView((ctx, h) => {
  const name = ctx.get("name");

  return h("h1", "Hello ", name, "!");
});
```

The same thing with JSX:

```js
const Example = makeView((ctx) => {
  return <Subview name="world" />;
});

const Subview = makeView((ctx) => {
  const name = ctx.get("name");

  return <h1>Hello {name}!</h1>;
});
```

### Helpers

Helpers supply the control flow you would expect when creating dynamic views, like conditionals and loops.

#### Conditionals (`when` and `unless`)

- `ctx.when($binding, element)`
- `ctx.when("key", element)`

- `ctx.unless($binding, element)`
- `ctx.unless("key", element)`

The `when` helper displays the element only when the bound value is truthy, while `unless` displays the element only when
the bound value is falsy. The condition can be a plain value, a $binding, or the name of a view state key to bind to.

```js
const Example = makeView((ctx, h) => {
  ctx.defaultState = {
    on: false,
  };

  function toggle() {
    ctx.set("on", (on) => !on);
  }

  return h("div", [
    ctx.when("on", h("h1", "Is On")),
    ctx.unless("on", h("h1", "Is Off")),

    h("button", { onclick: toggle }, "Toggle"),
  ]);
});
```

#### Looping

- `ctx.repeat($binding, callback)`
- `ctx.repeat("key", callback)`

Repeats a render callback once for each item in an array.

```js
const Example = makeView((ctx, h) => {
  ctx.defaultState = {
    list: ["one", "two", "three"],
  };

  return h(
    "ul",

    // Render once for each item in $list. Updates when $list changes.
    ctx.repeat("list", function ($item) {
      // Return an <li> that contains the current value of this list item.
      return h("li", $item);
    })
  );
});
```

The `repeat` function uses keys to identify which items have been changed, added or removed. By default, `repeat` uses
the value itself as a key. You must specify a key yourself if your array might have two or more identical values. If
you're looping through an array of objects with unique IDs, you will usually want to use the object's ID as the key.

If you'd like to specify the key you can pass a function as the third argument:

```js
// Use the list item's `id` field as the key.
ctx.repeat($list, View, (item, index) => item.id);
```

#### Children &amp; Other Elements

- `ctx.outlet()`
- `ctx.outlet($binding)`
- `ctx.outlet("key")`
- `ctx.outlet($binding, callback)`
- `ctx.outlet("key", callback)`

Renders elements from state to DOM, optionally through the use of a render callback to convert the value into something
renderable. Called anew every time the value changes.

Renders `children` if called without any arguments.

```js
const Example = makeView((ctx, h) => {
  ctx.defaultState = {
    value: "one",
  };

  return h(
    "div",

    // Displays the return value of the function each time the value changes.
    ctx.outlet("value", ($value) => {
      return h("span", $value, "!!!");
    })
  );
});
```

## Dynamic Classes

Components also support dynamic classes. Pass an object where the keys are the class names, and the classes are added to
the element while the values are truthy. The values can be \$states if you want to toggle classes dynamically.

```jsx
const Example = makeView((ctx, h) => {
  return h(
    "div",
    {
      class: {
        // Always includes "container" class
        container: true,

        // Includes "active" class when 'isActive' attribute is truthy
        active: ctx.readable("isActive"),
      },
    },
    ctx.outlet()
  );
});
```

Multiple classes:

```jsx
const Example = makeView((ctx, h) => {
  return h(
    "div",
    {
      class: ["one", "two"],
    },
    ctx.outlet()
  );
});
```

A combination:

```jsx
const Example = makeView((ctx) => {
  // The 'container' class is always included while the ones
  // inside the object are shown if their value is truthy.
  return (
    <div
      class={[
        "container",
        {
          active: ctx.readable("isActive"),
        },
      ]}
    >
      {ctx.outlet()}
    </div>
  );
});
```

## Globals

Globals are a great way to share state and logic between multiple views. Sometimes you have components in different
hierarchies that don't easily support typical data binding, such as when you need to access the same data from multiple
routes.

Globals are singletons, meaning only one copy of that global exists per app, and all `.global(name)` calls get the
same instance of `name`.

The following example shows a counter with one page to display the number and another to modify it. Both routes share
data through a `counter` global.

```js
// The `counter` global holds the current count and provides methods for incrementing and decrementing.
app.global("counter", function (ctx) {
  ctx.defaultState = {
    count: 0,
  };

  return {
    $current: ctx.readable("count"), // Exports a read only version that views can only change through the methods.

    increment() {
      ctx.set("count", (current) => current + 1);
    },

    decrement() {
      ctx.set("count", (current) => current - 1);
    },
  };
});

app.route("/counter", function () {
  return (
    <div>
      <h1>World's Most Inconvenient Counter Demo</h1>
      <a href="/counter/view">See the number</a>
      <a href="/counter/controls">Change the number</a>
    </div>
  );
});

// The window route displays the count but doesn't let the user change it.
app.route("/counter/window", function (ctx) {
  const { $current } = ctx.global("counter");

  return <h1>The Count is Now {$current}</h1>;
});

// The controls route lets the user change the count but doesn't display it.
app.route("/counter/controls", function (ctx) {
  const { increment, decrement } = ctx.global("counter");

  return (
    <div>
      <button onclick={increment}>Increment</button>
      <button onclick={decrement}>Decrement</button>
    </div>
  );
});
```

### Global Context

```js
app.global("example", function (ctx) {
  // Access other globals by the name they were registered under.
  // The globals being accessed must have been registered before this one or the app will throw an error.
  const global = ctx.global("name");

  ctx.defaultState = {
    title: "THE TITLE",
  };

  const title = ctx.get("title");
  const $title = ctx.readable("title");
  const $$title = ctx.writable("title");

  ctx.set("title", "New Title");

  // Runs a callback function each time a state changes (or any observable emits a value).
  ctx.observe($title, (title) => {
    console.log("title attribute changed to " + title);
  });

  // Print debug messages
  ctx.name = "example"; // Prefix messages in the console to make tracing easier at a glance.
  ctx.log("Something happened.");
  ctx.warn("Something happened!");
  ctx.error("SOMETHING HAPPENED!!!!");

  ctx.beforeConnect(() => {
    // Runs when the global is about to be (but is not yet) initialized, before any routing occurs.
  });

  ctx.afterConnect(() => {
    // Runs after the app is connected, initial route has been matched, and the first window is added to the page.
  });
  // Globals live for the lifetime of the app, so they have no disconnect hooks.

  // All globals must return an object.
  return {};
});
```

## Testing

See [the testing README](./lib/testing/README.md).

---

🦆
