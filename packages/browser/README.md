# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser?style=flat&label=gzipped%20size)

This is the front-end (browser) component of Frameworke. It handles [routing](#routing), components (two types; [views](#views) and [stores](#stores)) and [data binding](#state), all out of the box, aiming to cover the common needs of modern web apps.

## Installation

### CDN

Browser includes everything you need to make a fully functioning web app by importing the `@borf/browser` module from a CDN. We recommend Skypack or Unpkg, as shown below. This is the fastest way to get up and running in a browser without configuring a build step.

```js
import { ... } from "https://cdn.skypack.dev/@borf/browser";
import { ... } from "https://unpkg.com/@borf/browser";
```

### NPM

You can also get `@borf/browser` from npm. Best used in combination with `@borf/build` which adds support for JSX, a dev server with auto-reload, optimized production builds and more. Run this in your project directory:

```
$ npm i -D @borf/build @borf/browser
```

And the imports will look like this:

```js
import { ... } from "@borf/browser";
```

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
    <title>Borf Demo</title>
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

```tsx
import { App } from "https://cdn.skypack.dev/@borf/browser";

const Hello = new App({
  view: function setup(ctx, m) {
    return m("h1", "Hello world!");
  },
});

// Display this app inside the element with `id="app"`
Hello.connect("#app");
```

Now when you visit the page the document should look something like this:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Fronte Demo</title>
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

Most web apps today are what's known as an SPA, or single-page app, consisting of one HTML page with links to a handful of JS files containing the bundled app code. The code on this one page uses browser APIs to manipulate the document, simulating navigation between multiple "pages", but retaining all JavaScript state because no actual reloads take place.

Routes determine which view is shown based on the current URL.

By building an app around routes, lots of things we expect from a web app will just work; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Borf is aesthetically inspired by [choo.js](https://www.choo.io/docs/routing)
with technical inspiration from [@reach/router](https://reach.tech/router/), as routes are matched by highest specificity regardless of the order they were registered in. This avoids a lot of confusing situations that come up with route matching in order-based routers like `express`.

### Route Matching

Route patterns are a set of fragments separated by `/`. These fragments are of three types.

- Static: `/this/is/static` and will match only when the route is exactly `/this/is/static`.
- Dynamic: `/users/{id}/edit` will match anything that fits the static parts of the route and stores the parts enclosed in `{}` as named params. Named params will match anything, like `123` or `BobJones`. You can access these values inside the view.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that as a `wildcard` named param. `*` is valid only at the end of a route.

```js
import { PersonDetails, ThingIndex, ThingDetails, ThingEdit, ThingDelete } from "./components.js";

const app = new App();

app
  // {name} is a named param that accepts any value.
  .addRoute("/people/{name}", PersonDetails)

  // Routes can be nested. A `null` component creates a route that acts as a namespace for a set of subroutes.
  .addRoute("/things", null, (sub) => {
    sub.addRoute("/", ThingIndex);

    // {#id} is a named param that matches a numeric value only.
    sub.addRoute("/{#id}", ThingDetails);
    sub.addRoute("/{#id}/edit", ThingEdit);
    sub.addRoute("/{#id}/delete", ThingDelete);
  });

// Anatomy of the `router` store:
const ThingDetails = View.define({
  setup(ctx, m) {
    // `router` store provides controls for and info about the router.
    const router = ctx.useStore("router");

    // Info about the current route is exported as a set of Readables. Query params are also Writable through $$query:
    const { $path, $pattern, $params, $$query } = router;

    // Functions are exported for navigation:
    const { back, forward, navigate } = router;

    back(); // Step back in the history to the previous route, if any.
    back(-2); // Hit the back button twice.

    forward(); // Step forward in the history to the next route, if any.
    forward(4); // Hit the forward button 4 times.

    navigate("/another/page"); // Navigate to another route within the same app.
    navigate("https://www.example.com/another/site"); // Navigate to another domain entirely.

    // Three ways to confirm with the user that they wish to navigate before actually doing it.
    navigate("/another/page", { prompt: true });
    navigate("/another/page", { prompt: "Are you sure you want to leave and go to /another/page?" });
    navigate("/another/page", { prompt: PromptView });

    // Get the live value of `{id}` from the current path.
    const $id = $params.as((p) => p.id);

    // Render it into a <p> tag. The ID portion will update if the URL changes.
    return m("p", "User's ID is ", $id);
  },
});
```

## State

In a Borf app, all data that changes is stored in a State. All interested parties observe that State and update themselves automatically. Borf has no virtual DOM or re-rendering. Everything is just a side effect of a State change.

```js
import { View, State } from "@borf/browser";

/**
 * Displays a timer that shows an ever-incrementing count of seconds elapsed.
 * Also displays a button to reset the timer to 0.
 */
const Timer = View.define({
  label: "TimerExample",
  setup(ctx) {
    // Use regular variables to store data. Setup is only called once, so this function scope is here for the lifetime of the view.
    let interval = null;

    // the $$ naming convention indicates a binding is writable (supports .set, .update, ...)
    const $$seconds = new State(0);

    // the $ naming convention denotes a read-only binding
    const $seconds = $$seconds.readable();

    function increment() {
      $$seconds.update((value) => value + 1);
    }

    function reset() {
      $$seconds.set(0);
    }

    // Increment once per second after the view is connected to the DOM.
    ctx.onConnect(function () {
      interval = setInterval(increment, 1000);
    });

    // Stop incrementing when the view is disconnected.
    ctx.onDisconnect(function () {
      clearInterval(interval);
    });

    return (
      <div class="timer">
        <span>{$seconds}</span>

        {/* Button calls reset() when clicked */}
        <button onclick={reset}>Reset</button>
      </div>
    );
  },
});
```

## Views

Views are reusable modules with their own markup and logic. You can define a view once and reuse it as many
times as you need. Views can take inputs that set their default state and establish data bindings.

```jsx
const Example = View.define({
  setup: (ctx) => {
    return (
      <div>
        <h1>{ctx.inputs.get("title")}</h1>
        <p>This is a reusable view.</p>
      </div>
    );
  },
});

// Views can be mounted directly on a route.
app.addRoute("/example", Example);

// They can also be used inside another view.
app.addRoute("/other", (ctx) => {
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
const Example = View.define({
  setup: (ctx, m) => {
    // Access the built-in stores by name
    const http = ctx.useStore("http");
    const page = ctx.useStore("page");
    const router = ctx.useStore("router");
    const dialog = ctx.useStore("dialog");
    const language = ctx.useStore("language");

    // Access custom stores by reference
    const some = ctx.useStore(SomeStore);
    const other = ctx.useStore(OtherStore);

    /*=================================*\
    ||             Logging             ||
    \*=================================*/

    ctx.log("Something happened.");
    ctx.warn("Something happened!");
    ctx.error("SOMETHING HAPPENED!!!!");
    ctx.crash(new Error("FUBAR"));

    /*=================================*\
    ||              State              ||
    \*=================================*/

    // Creates a writable (two-way) binding with a default value.
    const $$title = new State("The Default Title");

    // Runs a callback function each time a state changes (or any observable emits a value).
    ctx.observe($$title, (title) => {
      console.log("title attribute changed to " + title);
    });

    // Merge two or more bindings into a single binding.
    const $formattedTitle = State.merge($$title, some.$uppercase, (title, uppercase) => {
      if (uppercase) {
        return title.toUpperCase();
      }

      return title;
    });

    /*=================================*\
    ||            Lifecycle            ||
    \*=================================*/

    ctx.isConnected; // true if view is connected

    ctx.onConnect(() => {
      // Runs after the view is added to the page.
    });

    ctx.onDisconnect(() => {
      // Runs after the view is removed from the page.
    });

    ctx.animateIn(async () => {});

    ctx.animateOut(async () => {});

    /*=================================*\
    ||      Rendering & Children       ||
    \*=================================*/

    m.when();
    m.unless();
    m.observe();
    m.repeat();

    // Render children inside a `<div class="container">`
    return m("div", { class: "container" }, ctx.outlet());
  },
});
```

### Templating

Templating is how you create elements. There are two ways to do it; first is calling the `m`arkup function which is passed as the second argument to `setup`.

The markup function has these signatures:

```js
m(tagname, [attributes, ][...children])
m(view, [inputs, ][...children])
```

```jsx
const Example = View.define({
  label: "ExampleView",
  setup: (ctx, m) => {
    return m("section", [
      m("h1", "Item List"),
      m("p", { style: "color: red" }, "Below is a list of items."),
      m("ul", [
        m("li", "Item 1"),
        m("li", { class: "active" }, "Item 2"),
        m("li", "Item 3"),
        m("li", "Item 4"),
        m("li", "Item 5"),
        m("li", "Item 6"),
      ]),
    ]);
  },
});
```

The second is using JSX. You can do this when building with `@borf/build`, but it won't work out of the box in a browser.

> Note that Borf uses a `class` attribute like HTML rather than `className` like React.

```jsx
const Example = View.define({
  label: "ExampleView",
  setup: (ctx, m) => {
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
  },
});
```

---

[🦆](https://www.manyducks.co)
