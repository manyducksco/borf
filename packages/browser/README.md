# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/min/@borf/browser)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser)

This is the front-end (browser) component of [Borf](https://www.borfjs.com). It handles [routing](#routing), components (two types; [views](#views) and [stores](#stores)) and [data binding](#state), all out of the box, aiming to cover the common needs of modern web apps while striking a balance between features and size.

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
    <main id="app">
      <!-- app goes here -->
    </main>

    <script async src="./app.js"></script>
  </body>
</html>
```

Inside `app.js`:

```js
import { App } from "https://cdn.skypack.dev/@borf/browser";

const app = new App();

// A root view is always displayed while the app is connected.
app.addRootView((ctx, m) => {
  return m("h1", "Hello world!");
});

// Display this app inside the element with `id="app"`
app.connect("#app");
```

Most methods on App are chainable, so you could condense the above example thus:

```js
new App()
  .addRootView((ctx, m) => {
    return m("h1", "Hello world!");
  })
  .connect("#app");
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

## Views

In our Hello World example above, you saw a piece of code that looked like this:

```js
app.addRootView((ctx, m) => {
  return m("h1", "Hello world!");
});
```

That is a View, or more specifically a `setup` function for one. We could refactor this slightly to make it a standalone View:

```js
import { View } from "@borf/browser";

const HelloWorld = View.define({
  setup: (ctx, m) => {
    return m("h1", "Hello world!");
  },
});

// This time we're passing in a whole View.
app.addRootView(HelloWorld);
```

Views are what most other JS frameworks call a component; a reusable chunk of markup and logic that takes attributes/props/inputs/etc and returns what's going to be displayed to the user. As you might expect if you have experience with React, Views can be used just like typical HTML elements.

> Borf has two types of components; Views and Stores. Views deal with displaying DOM nodes and handling user input, while Stores manage shared state that is accessible to multiple components. Stores are explained in more depth later in this README.

```js
app.addRootView((ctx, m) => {
  return m("div", [
    m("p", "This is the message:"),

    // Views are passed to `m` in place of an HTML tag.
    m(HelloWorld),
  ]);
});
```

Which renders the equivalent to the following HTML:

```html
<div>
  <p>This is the message:</p>
  <h1>Hello world!</h1>
</div>
```

### Templating

Templating is how you create elements. There are two ways to do it; first is calling the `m`arkup function which is passed as the second argument to `setup`.

The markup function has these signatures:

```js
m(tagname, [attributes, ][...children])
m(view, [inputs, ][...children])
```

```jsx
const ListItem = View.define({
  inputs: {
    active: {
      default: false,
    },
  },
  setup: (ctx, m) => {
    const $active = ctx.inputs.readable("active");

    return m(
      "li",
      {
        // 'active' class only applied while `active` input is true.
        class: { active: $active },
      },
      ctx.outlet()
    );
  },
});

const ExampleList = View.define({
  setup: (ctx, m) => {
    return m("section", [
      m("h1", { class: "heading" }, "Item List"),
      m("p", { style: "color: red" }, "Below is a list of items."),
      m("ul", [
        m(ListItem, "Item 1"),
        m(ListItem, { active: true }, "Item 2"),
        m(ListItem, "Item 3"),
        m(ListItem, "Item 4"),
        m(ListItem, "Item 5"),
        m(ListItem, "Item 6"),
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
        <h1 class="heading">Item List</h1>
        <p style="color: red">Below is a list of items.</p>
        <ul>
          <ListItem>Item 1</ListItem>
          <ListItem active>Item 2</ListItem>
          <ListItem>Item 3</ListItem>
          <ListItem>Item 4</ListItem>
          <ListItem>Item 5</ListItem>
          <ListItem>Item 6</ListItem>
        </ul>
      </section>
    );
  },
});
```

### Special Views

> TODO: Describe better. The following is a rough draft.

The `View` class includes a few helpers for conditional rendering, loops and rendering based on observables. Unlike views created with `View.define`, these views can be used inline.

These special views take an observable (or a static value) as a first argument.

```jsx
// Conditional:
View.when(value, <h1>Value is truthy</h1>, <h1>Value is falsy</h1>);
View.unless(value, <h1>Value is not truthy</h1>);

// Looping:
View.repeat(array, (ctx, m) => {
  const $item = ctx.inputs.readable("item");
  const $name = $item.map((x) => x.name);

  return m("li", $name);
});

// Observables:
View.subscribe(observable, (value) => {
  return; /* render something */
});
View.subscribe([observable1, observable2], (value1, value2) => {
  return; /* render something */
});

// Full example:
const Example = View.define({
  inputs: {
    header: {
      default: "This is the default header",
    },
  },

  setup: (ctx) => {
    const $header = ctx.inputs.readable("header");
    const $showContent = new State(false);
    const $names = new State(["one", "two", "three"]);

    // How it looks with `m` function:
    return m("section", [
      m("header", [
        View.subscribe($header, (text) => {
          // This doesn't make any sense because you could just pass $header directly, but whatever.
          return m("h1", text);
        }),
      ]),

      View.when($showContent, m("p", "This content is only shown while showContent is true.")),
      View.unless($showContent, m("p", "Content is hidden.")),

      m(
        "ul",
        View.repeat($names, (ctx) => {
          const $name = ctx.inputs.readable("value");
          const $index = ctx.inputs.readable("index");

          return m("li", `#${$index}: ${$name}`);
        })
      ),
    ]);

    // How it looks with JSX:
    return (
      <section>
        <header>
          {View.subscribe($header, (text) => {
            // This doesn't make any sense because you could just pass $header directly, but whatever.
            return <h1>{text}</h1>;
          })}
        </header>

        {View.when($showContent, <p>This content is only shown while showContent is true.</p>)}
        {View.unless($showContent, <p>Content is hidden.</p>)}

        <ul>
          {View.repeat($names, (ctx) => {
            const $name = ctx.inputs.readable("value");
            const $index = ctx.inputs.readable("index");

            return (
              <li>
                #{$index}: {$name}
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
});
```

### Full View Example

```js
const Example = View.define({
  label: "ExampleView",  // Recommended. What this view is called for console and dev tools purposes.
  about: "Demonstrates all options and methods of a View.",
  inputs: {
    someValue: {
      about: "An optional string input with validation.",
      assert: (x) => {
        if (typeof x !== "string") {
          throw new TypeError(`Must be a string.`);
        }
        return true;
      },
      optional: true,
    }
    otherValue: {
      about: "Another string input with a default value.",
      default: "<no-value>"
    }
  },
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

    // Using State to create an observable for 'subscribe'. See later in this README for details.
    const $$title = new State("The Default Title");

    // Subscribes to an observable while this view is connected.
    ctx.subscribe($$title, (title) => {
      ctx.log("title attribute changed to " + title);
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

    /*=================================*\
    ||            Animation            ||
    \*=================================*/

    // Using a Spring to animate translateY % of container element.
    const spring = new Spring(100);

    ctx.animateIn(async () => {
      return spring.to(0); // Returns a promise that resolves after Spring value transitions to 1.
    });

    ctx.animateOut(async () => {
      return spring.to(100); // View is not completely removed until this promise resolves.
    });

    /*=================================*\
    ||      Rendering & Children       ||
    \*=================================*/

    // Render children inside a `<div class="container">`
    return m(
      "div",
      {
        class: "container",
        style: {
          transform: spring.map(x => `translateY(${x}%)`)
        }
      },
      ctx.outlet()
    );
  },
});
```

## Stores

The other kind of component is a Store. Stores return an object which can be accessed by any subcomponent. Let's refactor the Hello World example.

```js
import { App, View, Store } from "@borf/browser";

const app = new App();

// Stores, like views, have to be instantiated to be used.
const MessageStore = Store.define({
  setup: (ctx) => {
    return {
      message: "Hello world!",
    };
  },
});

const HelloWorld = View.define({
  setup: (ctx, m) => {
    // Where this call gets its instance depends on how we instantiate the store.
    const store = ctx.useStore(MessageStore);

    return m("h1", store.message);
  },
});
```

Now that we have a store, there are two ways to make it available in the `HelloWorld` view.

### Option 1: Global Store

Passing a Store to `app.addStore()` will create one instance and make that instance available to all components in the app.

```js
// Add the store to make it available to any component in this app.
app.addStore(MessageStore);

// HelloWorld can access MessageStore from the app.
app.addRootView(HelloWorld);
```

### Option 2: Local Store

Using a Store inside a View will create one instance and make that instance available to subcomponents only.

If you've ever worked on an app of sufficient size, you know that scoping state to specific parts of the app is extremely helpful.

```js
app.addRootView((ctx, m) => {
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
const PersonDetails = View.define({
  setup(ctx, m) {
    // `router` store allows you to work with the router from inside the app.
    const router = ctx.useStore("router");

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
    return m("p", "The person is:", $name);
  },
});
```

## State

In a Borf app, all data that changes is stored in a State. All interested parties subscribe to that State and update themselves automatically. Borf has no virtual DOM or re-rendering. Components are set up once, and everything beyond that is a side effect of a State change.

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

    // Increment once per second after the view is connected to the DOM.
    ctx.onConnect(function () {
      function increment() {
        // Update uses a function to derive a new value from the current one.
        $$seconds.update((value) => value + 1);
      }

      interval = setInterval(increment, 1000);
    });

    // Stop incrementing when the view is disconnected.
    ctx.onDisconnect(function () {
      clearInterval(interval);
    });

    return (
      <div class="timer">
        <span>{$seconds}</span>

        <button
          onclick={() => {
            // Set replaces the current value with a new one.
            $$seconds.set(0);
          }}
        >
          Reset
        </button>
      </div>
    );
  },
});
```

---

[🦆](https://www.manyducks.co)