# 🐕🖥 woofe

![bundle size](https://img.shields.io/bundlephobia/minzip/woofe?style=flat&label=gzipped%20size)

Woofe is a front end framework that aims to cover the most common needs of modern web apps. It handles [routing](#routing), [global](#globals) state, components (called [views](#views)) and [data binding](#state), all out of the box.

## Terms

- App
- Component (anything you write that plugs into woofe)
  - View
  - Store
- Attributes (any values you pass to a Component)
- Markup (any HTML element or component returned from a View)
- Readable / Writable (dynamic data containers with different levels of access)

- Author (developer using woofe)
- User (end user of the app)

## Installation

### CDN

Woof includes everything you need to make a fully functioning web app by importing the `woofe` module from a CDN. We recommend Skypack or Unpkg, as shown below. This is the fastest way to get up and running in a browser without configuring a build step.

```js
import { ... } from "https://cdn.skypack.dev/woofe";
import { ... } from "https://unpkg.com/woofe"
```

### NPM

You can also get `woofe` from npm. Best used in combination with `builde` which adds support for JSX, a dev server with auto-reload, optimized production builds and more. Run this in your project directory:

```
$ npm i -D builde woofe
```

And the imports will look like this:

```js
import { ... } from "woofe";
```

See the [builde]() docs for configuration tips.

## Hello World

Suppose you have two files on your web server:

```
index.html
app.js
```

Inside `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Woofe Demo</title>
  </head>
  <body>
    <main id="app">
      <!-- app goes here -->
    </main>

    <script async src="./app.js"></script>
  </body>
</html>
```

Inside `app.js`:

```js
import { makeApp } from "https://cdn.skypack.dev/woofe";

class Random extends Store {
  setup(ctx) {
    return {
      get value() {
        return ~~(Math.random() * 100);
      },
    };
  }
}

type SubViewAttrs = {
  onClick: () => void,
};

class SubView extends View<SubViewAttrs> {
  static attrs = {
    onClick: {
      type: "function",
      required: true,
    },
  };

  setup(ctx, m) {
    const { onClick } = ctx.attrs.get();

    return m("h1", { onClick }, ctx.outlet());
  }
}

class App extends View {
  setup(ctx, m) {
    const http = ctx.useStore("http");
    const random = ctx.useStore(Random);

    function onClick() {
      alert(`Today's random number is ${random.value}.`);
    }

    return m(SubView, { onClick }, "Hello World");
  }
}

const Hello = makeApp({
  stores: [Random], // One global instance loaded here
  view: App, // Accessible in here
});

// Stores are also components, so this is equivalent to above:
const Hello = makeApp({
  view: () => (
    <Random>
      <App />
    </Random>
  ),
});

// Display this app inside the element with `id="app"`
Hello.connect("#app");
```

Now when you visit the page the document should look something like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Woofe Demo</title>
  </head>
  <body>
    <main id="app">
      <h1>Hello World</h1>
    </main>

    <script async src="./app.js"></script>
  </body>
</html>
```

> TODO: Summarize and link to sections to learn more about what was demonstrated: [views](#views), [routing](#routing), etc.

## Routing

Routes are used to separate your app into distinct pages displayed according to the current URL.

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

  // Get the live value of :id
  const $id = $params.as((p) => p.id);

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
import { makeView } from "woofe";

const Timer = makeView((ctx) => {
  // Binding naming conventions.
  // Prepend $$ for writable bindings and $ for readable ones.
  // Consider: one $ for a one-way binding, two $ for a two-way binding
  const $$seconds = ctx.state(0);
  const $seconds = $$seconds.readable();

  function increment() {
    $$seconds.update((value) => value + 1);
  }

  function reset() {
    $$seconds.set(0);
  }

  // Increment once per second after the view is connected to the DOM.
  ctx.afterConnect(function () {
    setInterval(increment, 1000);
  });

  return (
    <div>
      <input type="text" value={$seconds} disabled />
      <button onclick={reset}>Reset Counter</button>
    </div>
  );
});
```

## Views

Views are reusable modules with their own markup and logic. You can define a view once and reuse it as many
times as you need. Views can take attributes that set their default state and establish data bindings.

```jsx
const Example = makeView((ctx) => {
  return (
    <div>
      <h1>{ctx.attrs.title}</h1>
      <p>This is a reusable view.</p>
    </div>
  );
});

// Views can be mounted directly on a route.
app.route("example", Example);

// They can also be used inside another view.
app.route("other", (ctx) => {
  return (
    <div>
      <Example title="In Another View" />
    </div>
  );
});
```

### View Context

Views receive a context object they may use to translate state and lifecycle into DOM nodes.

```js
const Example = makeView((ctx, m) => {
  // Access globals by name.
  const global = ctx.global("name");

  const local = ctx.local("name");

  /*=================================*\
  ||             Logging             ||
  \*=================================*/

  ctx.log("Something happened.");
  ctx.warn("Something happened!");
  ctx.error("SOMETHING HAPPENED!!!!");

  /*=================================*\
  ||              State              ||
  \*=================================*/

  // Creates a writable (two-way) binding with a default value.
  const $$title = makeState("The Default Title");

  // Runs a callback function each time a state changes (or any observable emits a value).
  ctx.observe($$title, (title) => {
    console.log("title attribute changed to " + title);
  });

  // Merge two or more bindings into a single binding.
  const $formattedTitle = ctx.merge($$title, global.$uppercase, (title, uppercase) => {
    if (uppercase) {
      return title.toUpperCase();
    }

    return title;
  });

  /*=================================*\
  ||            Lifecycle            ||
  \*=================================*/

  ctx.isConnected; // true if view is connected

  ctx.beforeConnect(() => {
    // Runs when the view is about to be (but is not yet) added to the page.
  });

  ctx.animateIn(async () => {});

  ctx.afterConnect(() => {
    // Runs after the view is added to the page.
  });

  ctx.beforeDisconnect(() => {
    // Runs when the view is about to be (but is not yet) removed from the page.
  });

  ctx.animateOut(async () => {});

  ctx.afterDisconnect(() => {
    // Runs after the view is removed from the page.
  });

  /*=================================*\
  ||      Rendering & Children       ||
  \*=================================*/

  m.when();
  m.unless();
  m.observe();
  m.repeat();

  //   m.ul($items, { class: "list-class" }, (ctx) => {
  //     const $value = ctx.attrs.readable("value");
  //
  //     return <li>{$value}</li>;
  //   });

  // Render children inside a `<div class="container">`
  return m("div", { class: "container" }, ctx.outlet());
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

Woof supports JSX with the help of `@woofjs/build`, so if you want to write your views as HTML to begin with you can do that. However, it's important to understand how `h` works because that's ultimately what the JSX compiles down to.

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
  return h("h1", "Hello from inside another view!");
});
```

When using subviews, you can pass them attributes just like you can with HTML elements. The Example views in
the following code will display `<h1>Hello world!</h1>`.

```js
const Example = makeView((ctx, h) => {
  return h(Subview, { name: "world" });
});

const Subview = makeView((ctx, h) => {
  const { name } = ctx.attrs;

  return h("h1", "Hello ", name, "!");
});
```

The same thing with JSX:

```js
const Example = makeView((ctx) => {
  return <Subview name="world" />;
});

const Subview = makeView((ctx) => {
  const { name } = ctx.attrs;

  return <h1>Hello {name}!</h1>;
});
```

### Helpers

Helpers supply the control flow you would expect when creating dynamic views, like conditionals and loops.

#### Conditionals (`when` and `unless`)

- `ctx.when($binding, element)`

- `ctx.unless($binding, element)`

The `when` helper displays the element only when the bound value is truthy, while `unless` displays the element only when
the bound value is falsy. The condition can be a plain value, a $binding, or the name of a view state key to bind to.

```js
const Example = makeView((ctx, h) => {
  const $$on = ctx.state(false);

  function toggle() {
    $$on.update((on) => !on);
  }

  return (
    <div>
      {ctx.when($$on, <h1>Is On</h1>)}
      {ctx.unless($$on, <h1>Is Off</h1>)}

      <button onclick={toggle}>Toggle</button>
    </div>
  );
});
```

#### Pattern Matching (`match`)

- `ctx.match($binding, cases)`

Renders the first matching case from the value of a binding.

```js
const Example = makeView((ctx, h) => {
  const $$tab = ctx.state("home");

  // Displays a set of tabs and content for the most recently clicked tab.
  return (
    <main>
      <nav class="tabs">
        <ul>
          <li>
            <button class="tab-button" onclick={() => $$tab.set("home")}>
              Home
            </button>
          </li>
          <li>
            <button class="tab-button" onclick={() => $$tab.set("photos")}>
              Photos
            </button>
          </li>
          <li>
            <button class="tab-button" onclick={() => $$tab.set("contacts")}>
              Contacts
            </button>
          </li>
        </ul>
      </nav>

      <div class="content">
        {ctx.match($$tab, [
          ["home", <HomeContent />],
          ["photos", <PhotosContent />],
          ["contacts", <ContactsContent />],
          <NoTabContent />, // Fallback content if none of the cases match.
        ])}
      </div>
    </main>
  );
});
```

The `cases` structure is a 2D array of `[value, result]` (followed by an optional `fallback` item) where:

- `value` can be either a literal or a condition function: `(value) => boolean`
- `result` can be either a renderable element or a render function returning a renderable element: `(value) => element`
- `fallback` can be either a renderable element or a render function returning a renderable element: `(value) => element`

```js
ctx.match($$tab, [
  // Do unnecessary processing on the tab name to determine if it's the one.
  // Has the same result as the "home" literal in the example above.
  [(tab) => tab.toUpperCase() === "HOME", <HomeContent />],

  // Pass "PHOTOS!" as the `title` attribute when rendering <PhotosContent>.
  ["photos", (tab) => <PhotosContent title={tab.toUpperCase() + "!"} />],

  ["contacts", <ContactsContent />],

  // Fallback: passes the tab name to <NoTabContent>, presumably to tell the user the unknown tab.
  (tab) => <NoTabContent tabName={tab} />,
]);
```

#### Looping

- `ctx.repeat($binding, callback)`

Repeats a render callback once for each item in an array.

```js
const Example = makeView((ctx, h) => {
  const $$list = ctx.state(["one", "two", "three"]);

  return h(
    "ul",

    // Render once for each item in $$list. Updates when $$list changes.
    ctx.repeat($$list, function ($item, $index) {
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
    ctx.outlet("value", (value) => {
      return h("span", value, "!!!");
    })
  );
});
```

## Dynamic Classes

Dynamic classes are also supported. Pass an object where the keys are the class names, and the classes are added to
the element while the values are truthy. The values can be \$states if you want to toggle classes dynamically.

```jsx
const Example = makeView((ctx, h) => {
  return h(
    "div",
    {
      class: {
        // Always includes "container" class
        container: true,

        // Includes "active" class when '$isActive' attribute is truthy
        active: ctx.attrs.$isActive,
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
          active: ctx.attrs.$isActive,
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
  const $$count = ctx.state(0);

  return {
    $current: $$count.readable(), // Exports a read only version that can only be changed through the methods.

    increment() {
      $$count.update((current) => current + 1);
    },

    decrement() {
      $$count.update((current) => current - 1);
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

  const $$title = ctx.state("THE TITLE");

  ctx.merge();

  // Runs a callback function each time a state changes (or any observable emits a value).
  ctx.observe($$title, (title) => {
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

# Utilities

This library also includes some utilities to help with really common tasks in frontend development:

- useRef
- makeDebounce
- makeTransitions

## Ref

Refs are functions that store a value when called with one, and return the last stored value when called with no arguments. Pass a ref as the `ref` attribute on any HTML element to store a reference to that element's DOM node once it's rendered to the page.

```js
import { makeView, makeRef } from "@woofjs/client";

const Example = makeView((ctx) => {
  const divRef = makeRef();

  ctx.afterConnect(() => {
    console.log("rendered element", divRef());
  });

  return <div ref={divRef} />;
});
```

## Debounce

Frequently in UI programming, you have events coming in constantly but only want to perform an action when they are done. For example, a search input that which waits 300ms after the user has stopped typing before making an API call.

Debouncing lets you call a function any number of times, but only the most recent call will actually execute when that time limit elapses.

```js
const debounced = makeDebounce(300, (value) => {
  console.log("debounced:", value);
});

debounced(1);
debounced(2);
debounced(3); // Only this one will fire, after 300 milliseconds

// Or take config object to support additional advanced options:
const debounced = makeDebounce({
  timeout: 300,
  immediate: true,
  callback: (value) => {
    console.log("debounced:", value);
  },
});

// If no callback is passed, a function is returned that takes and queues another function.
// Use this when you may have more than one function that should share a single queue.
const debounce = makeDebounce(300);

debounce(() => {
  console.log("debounced: 1");
});
debounce(() => {
  console.log("debounced: 2");
});
debounce(() => {
  console.log("debounced: 3"); // Only this one will run.
});
```

## Transitions

Defines a set of transitions for an element. Returns a function that applies these transitions to a given element.

```jsx
import { makeView, makeTransitions } from "@woofjs/client";
import { animate } from "popmotion";

// TODO: Change names to `enter` and `exit` since `in` causes weird syntax highlighting in some editors since it's a keyword.
const animated = makeTransitions({
  // Fade opacity from 0 to 1 when the element enters.
  enter: (ctx) => {
    animate({
      from: 0,
      to: 1,
      duration: 300,
      onUpdate: (current) => {
        ctx.node.style.opacity = current;
      },
      onComplete: () => {
        ctx.node.style.opacity = 1;
        ctx.done();
      },
    });
  },

  // Fade opacity from 1 to 0 when the element exits.
  exit: (ctx) => {
    animate({
      from: 1,
      to: 0,
      duration: 300,
      onUpdate: (current) => {
        ctx.node.style.opacity = current;
      },
      onComplete: () => {
        ctx.node.style.opacity = 1;
        ctx.done();
      },
    });
  },
});

const ExampleView = makeView((ctx, h) => {
  return h("section", [
    h("header", h("h1", "Animated List Items")),

    // Animate each list item as it enters and exits.
    ctx.repeat("items", ($item) => {
      return animated(h("li", $item));
    }),
  ]);
});
```

> TODO: Outline transition ctx.get, ctx.set and $transition attribute for transitioning views.

## Testing

See [the testing README](./lib/testing/README.md).

---

[🦆](https://www.manyducks.co)
