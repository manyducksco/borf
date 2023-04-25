# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/min/@borf/browser)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser)

This is the front-end (browser) component of [Borf](https://www.borfjs.com). It handles [routing](#routing), components (two types; [views](#views) and [stores](#stores)) and [data binding](#state), all out of the box, aiming to cover the common needs of modern web apps while striking a balance between features and size.

## About this README

### Terms

- User: the end user of the app.
- Author: the programmer who uses Borf to create an app; you.
- Framework: the Borf framework itself.
- Observable: an instance of Readable or Writable.
- Component: a view or store function.
  - View: a function that takes a component context and returns Markup or null.
  - Store: a function that takes a component context and returns a plain object.
- Markup: DOM templates created with the `m` function, a view helper, or an element function.

## Installation

### NPM

Most projects will install `@borf/browser` from npm. Best used in combination with `@borf/build` which adds support for JSX, a dev server with auto-reload, optimized production builds and more. Run this in your project directory:

```
$ npm i -D @borf/build @borf/browser
```

And the imports will look like this:

```js
import { ... } from "@borf/browser";
```

### CDN

This package includes everything you need to make a fully functioning web app by importing the `@borf/browser` module from a CDN. This is the fastest way to get code running in a browser with no compilation or bundling.

```js
// Using Skypack:
import { ... } from "https://cdn.skypack.dev/@borf/browser";

// Using unpkg:
import { ... } from "https://unpkg.com/@borf/browser";
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
    <main id="app"></main>

    <script async src="./app.js"></script>
  </body>
</html>
```

Inside `app.js`:

```js
import { App, m } from "@borf/browser";

const app = new App();

// Display this view at all times while the app is connected
app.setRootView(() => {
  return m.h1("Hello world!"); // `m` has helpers for all standard HTML5 elements
});

// Display app views as children of the element with an id of `app`
app.connect("#app");
```

Now when you visit the page the document should look like this (sans comment):

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Borf Demo</title>
  </head>
  <body>
    <main id="app">
      <!-- This is from the root view: -->
      <h1>Hello world!</h1>
    </main>

    <script async src="./app.js"></script>
  </body>
</html>
```

## Views

In our Hello World example above, you saw a piece of code that looked like this:

```js
app.setRootView(() => {
  return m.h1("Hello world!");
});

// As a standalone view function
function ExampleView() {
  return m.h1("Hello world!");
}
app.setRootView(ExampleView);
```

Views are what most other frameworks would call a component; a reusable chunk of markup and logic that takes attributes (like an HTML element) and returns DOM nodes to be displayed to the user. As you might expect if you have experience with React, Views can be used just like typical HTML elements.

> Borf has two types of components; Views and Stores. Views deal with displaying DOM nodes and handling user input, while Stores manage shared state that is accessible to multiple components. Stores are explained in more depth later in this README.

```js
import { View, m } from "@borf/browser";

function HelloWorld() {
  return m.h1("Hello world!");
}

function Layout() {
  return m.div(
    m.p("This is the message:"),

    // Views are passed directly to the `m` function to create an instance.
    m(HelloWorld)
  );
}
```

Which renders the equivalent to the following HTML:

```html
<div>
  <p>This is the message:</p>
  <h1>Hello world!</h1>
</div>
```

### Markup

Templating is done through the `m` util. It serves as both a function and an object with HTML tag helpers. All of these calls return a Markup element, which Borf uses as a template to create DOM nodes.

```js
m(tag, [attributes, ][...children])
m(component, [inputs, ][...children])

// HTML tags are also available as helper functions where `tag` is `span`, `h1`, etc:
m.tag([attributes, ][...children])
```

```tsx
function ListItem(self) {
  const $active = self.inputs.getReadable("active");

  // 'active' class only applied while `active` input is true.
  // Note that Borf uses a `class` attribute like HTML rather than `className` like React.
  return m.li({ class: { active: $active } }, self.outlet());
}

function ExampleList() {
  return m.section(
    m.h1({ class: "heading" }, "Item List"),
    m.p({ style: { color: "red" } }, "Below is a list of items."),
    m.ul(
      m(ListItem, "Item 1"),
      m(ListItem, { active: true }, "Item 2"),
      m(ListItem, "Item 3"),
      m(ListItem, "Item 4"),
      m(ListItem, "Item 5"),
      m(ListItem, "Item 6")
    )
  );
}
```

### Special Markup

> TODO: Describe these better. The following is a rough draft.

The `m` util includes a few helpers for conditional rendering, loops and rendering based on observables.

These helpers take an observable as a first argument.

```jsx
// Conditional:
m.$if($value, <h1>Value is truthy</h1>, <h1>Value is falsy</h1>);
m.$unless($value, <h1>Value is not truthy</h1>);

// Looping:
m.$repeat($list, ($item, $index, self) => {
  const $name = $item.map((x) => x.name);

  // self has the methods you would expect on a View `self`
  self.observe($name, (name) => {
    // Observe $name only while this forEach view is connected
    self.log("name is", name);
  });

  return m("li", $name);
});

// Observables:
m.$observe($value, (value) => {
  return; /* render something */
});
m.$observe([$value1, $value2], (value1, value2) => {
  return; /* render something */
});

// Full example:
function ExampleView(self) {
  const $header = self.inputs.$("header"); // Shorthand for getting a Readable input
  const $showContent = new Readable(false);
  const $names = new Readable(["one", "two", "three"]);

  // How it looks with `m` function:
  return m.section([
    m.header(
      m.$observe($header, (text) => {
        // This doesn't make any sense because you could just pass $header directly, but whatever.
        return m.h1(text);
      })
    ),

    m.$if($showContent, m.p("This content is only shown while showContent is true.")),
    m.$unless($showContent, m.p("Content is hidden.")),

    m.ul(
      m.$repeat($names, ($name, $index, self) => {
        // Use self for observers, etc.

        self.observe($name, (name) => {
          // Observe only while this forEach view instance is connected.
        });

        return m.li("#", $index, ": ", $name);
      })
    ),
  ]);
}
```

### Full Component Example

```js
function ExampleView(self) {
  // Access the built-in stores by name
  const http = self.useStore("http");
  const page = self.useStore("page");
  const router = self.useStore("router");
  const dialog = self.useStore("dialog");
  const language = self.useStore("language");

  // Access custom stores by reference
  const some = self.useStore(SomeStore);
  const other = self.useStore(OtherStore);

  /*=================================*\
  ||             Logging             ||
  \*=================================*/

  self.debug.log("Something happened.");
  self.debug.warn("Something happened!");
  self.debug.error("SOMETHING HAPPENED!!!!");
  self.crash(new Error("FUBAR"));

  /*=================================*\
  ||              State              ||
  \*=================================*/

  // Using Writable to create a value for 'observe'. See later in this README for details.
  const $$title = new Writable("The Default Title");

  // Observes a readable (or writable) while this view is connected.
  self.observe($$title, (title) => {
    self.debug.log("title attribute changed to " + title);
  });

  /*=================================*\
  ||            Lifecycle            ||
  \*=================================*/

  self.isConnected; // true if view is connected

  self.beforeConnected(async () => {
    // Promise resolves before onConnected callbacks are triggered.
  });

  self.beforeDisconnected(async () => {
    // Promise resolves before onDisconnected callbacks are triggered.
  });

  self.onConnected(() => {
    // Runs after the view is added to the page.
  });

  self.onDisconnected(() => {
    // Runs after the view is removed from the page.
  });

  /*=================================*\
  ||            Animation            ||
  \*=================================*/

  // Using a Spring to animate translateY % of container element.
  const spring = new Spring({ initialValue: 100 });

  self.beforeConnected(async () => {
    return spring.to(0); // Returns a promise that resolves after Spring value transitions to 1.
  });

  self.beforeDisconnected(async () => {
    return spring.to(100); // View is not completely removed until this promise resolves.
  });

  /*=================================*\
  ||      Rendering & Children       ||
  \*=================================*/

  // Render children inside a `<div class="container">`
  return m.div(
    {
      class: "container",
      style: {
        transform: spring.map((x) => `translateY(${x}%)`),
      },
    },
    self.outlet()
  );
}
```

## Stores

The other kind of component is a Store. Stores return an object which can be accessed by any subcomponent. Let's refactor the Hello World example.

```js
import { App, m } from "@borf/browser";

const app = new App();

function MessageStore(self) {
  return {
    message: "Hello world!",
  };
}

function HelloWorld(self) {
  // Where this call gets its instance depends on how we instantiate the store.
  const store = self.useStore(MessageStore);

  return m.h1(store.message);
}
```

Now that we have a store, there are two ways to make it available in the `HelloWorld` view.

### Option 1: Global Store

Passing a Store to `app.addStore()` will create one instance and make that instance available to all components in the app.

```js
// Add the store to make it available to any component in this app.
app.addStore(MessageStore);

// HelloWorld view can access MessageStore since it's part of the same app.
app.setRootView(HelloWorld);
```

### Option 2: Local Store

Using a Store inside a View will create one instance and make that instance available to subcomponents only.

If you've ever worked on an app of sufficient size, you know that scoping state to specific parts of the app is extremely helpful.

```js
app.setRootView(() => {
  return m(MessageStore, [
    // MessageStore is available to subcomponents.
    m(HelloWorld),
  ]);
});
```

## Routing

Most web apps today are what's known as an SPA, or single-page app, consisting of one HTML page with links to bundled app code. This code uses browser APIs to simulate navigation between multiple "pages" by swapping out page content based on the URL, but retains all JavaScript state that would normally be lost between page loads because no actual page loads take place. Despite the illusion of moving around the app, you never actually leave that one HTML page. This technique is generally known as client-side routing.

`@borf/browser` makes heavy use of client-side routing. You can define as many routes as you have views, and the URL will determine which one the app shows at any given time.

By building an app around routes, lots of things we expect from a web app will just work; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Borf is aesthetically inspired by [choo.js](https://www.choo.io/docs/routing)
with technical inspiration from [@reach/router](https://reach.tech/router/), as routes are matched by highest specificity regardless of the order they were registered. This avoids some confusing situations that come up with order-based routers like that of `express`. On the other hand, order-based routers can support regular expressions as patterns which Borf's router cannot.

### Route Patterns

Routes are defined with strings called patterns. A pattern defines the shape the URL path must match, with special placeholders for variables that appear within the route. Values matched by those placeholders are parsed out and exposed to your code (`router` store, `$params` readable). Below are some examples of patterns and how they work.

- Static: `/this/is/static` has no params and will match only when the route is exactly `/this/is/static`.
- Numeric params: `/users/{#id}/edit` has the named param `{#id}` which matches numbers only, such as `123` or `52`. The resulting value will be parsed as a number.
- Generic params: `/users/{name}` has the named param `{name}` which matches anything in that position in the path. The resulting value will be a string.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that in params as `wildcard`. `*` is valid only at the end of a route.

Now, here are some route examples in the context of an app:

```js
import { PersonDetails, ThingIndex, ThingDetails, ThingEdit, ThingDelete } from "./components.js";

const app = new App();

app
  .addRoute("/people/{name}", PersonDetails)

  // Routes can be nested. Also, a `null` component with subroutes acts as a namespace for those subroutes.
  // Passing a view instead of `null` results in subroutes being rendered inside that view wherever `ctx.outlet()` is called.
  .addRoute("/things", null, (sub) => {
    sub.addRoute("/", ThingIndex); // matches `/things`
    sub.addRoute("/{#id}", ThingDetails); // matches `/things/{#id}`
    sub.addRoute("/{#id}/edit", ThingEdit); // matches `/things/{#id}/edit`
    sub.addRoute("/{#id}/delete", ThingDelete); // matches `/things/{#id}/delete`
  });
```

As you may have inferred from the code above, when the URL matches a pattern the corresponding view is displayed. If we visit `/people/john`, we will see the `PersonDetails` view and the params will be `{ name: "john" }`. Params can be accessed inside those views through the built-in `router` store.

```js
function PersonDetails(self) {
  // `router` store allows you to work with the router from inside the app.
  const router = self.useStore("router");

  // Info about the current route is exported as a set of Readables. Query params are also Writable through $$query:
  const { $path, $pattern, $params, $$query } = router;

  // Functions are exported for navigation:
  const { back, forward, navigate } = router;

  back(); // Step back in the history to the previous route, if any.
  back(2); // Hit the back button twice.

  forward(); // Step forward in the history to the next route, if any.
  forward(4); // Hit the forward button 4 times.

  navigate("/things/152"); // Navigate to another path within the same app.
  navigate("https://www.example.com/another/site"); // Navigate to another domain entirely.

  // Three ways to confirm with the user that they wish to navigate before actually doing it.
  navigate("/another/page", { prompt: true });
  navigate("/another/page", { prompt: "Are you sure you want to leave and go to /another/page?" });
  navigate("/another/page", { prompt: PromptView });

  // Get the live value of `{name}` from the current path.
  const $name = $params.map((p) => p.name);

  // Render it into a <p> tag. The name portion will update if the URL changes.
  return m.p("The person is:", $name);
}
```

## Observable State: Readables and Writables

In a Borf app, all data that changes is stored in a Readable or a Writable. All interested parties subscribe to that value and update themselves automatically. Borf has no virtual DOM or re-rendering. Components are set up once, and everything beyond that is a side effect of a state change.

Typically, you'll be creating a `Writable` when you need to store a value that will change. Creating a `Readable` directly is rare, as `Readable` values are usually derived from a `Writable`, either explicitly with `.toReadable()` or implicitly as a result of an operation like `.map()`.

```js
import { Readable, Writable, m } from "@borf/browser";

/**
 * Displays a timer that shows an ever-incrementing count of seconds elapsed.
 * Also displays a button to reset the timer to 0.
 */
function Timer(self) {
  // Use regular variables to store data. Setup is only called once, so this function scope is here for the lifetime of the view.
  let interval = null;

  // the $$ naming convention indicates a binding is writable (supports .set, .update, ...)
  const $$seconds = new Writable(0);

  // the $ naming convention denotes a read-only binding
  // $seconds will always have the same value as $$seconds and can't be directly written.
  const $seconds = $$seconds.toReadable();
  const $seconds = new Readable($$seconds); // This is another way to do the same thing.

  // Increment once per second after the view is connected to the DOM.
  self.onConnected(function () {
    function increment() {
      // Update uses a function to derive a new value from the current one.
      $$seconds.update((value) => value + 1);
    }

    interval = setInterval(increment, 1000);
  });

  // Stop incrementing when the view is disconnected.
  self.onDisconnected(function () {
    clearInterval(interval);
  });

  return m.div({ class: "timer" }, [
    m.span($seconds),
    m.button(
      {
        onclick: () => {
          // Set replaces the current value with a new one.
          $$seconds.set(0);
        },
      },
      "Reset"
    ),
  ]);
}
```

> TODO: Explain Readable.merge()

---

[🦆](https://www.manyducks.co)
