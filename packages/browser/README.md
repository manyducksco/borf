# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/min/@borf/browser)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser)

> WARNING: This package is very early in development. There are frequent breaking changes, many bugs and undocumented
> or incorrectly documented features, and READMEs don't get updated in a timely manner.

This is the front-end portion of [Borf](https://www.borfjs.com). It handles things like components, [routing](#routing),
data binding, logging, and crash handling, all out-of-the-box, aiming to cover the common needs of modern web apps while
striking a balance between features and size.

## About this README

This README is written for web developers and hobbyists with a solid understanding of web browser technologies, especially HTML, JavaScript and the DOM APIs. Related terms are used with little or no explanation. It may be helpful to have prior experience building apps with another framework like [React](https://react.dev/) or [Vue](https://vuejs.org/) where more support and resources can be found.

### Recommended Reading

- [MDN: Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- [MDN: The HTML DOM API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API)

Code examples are written using [JSX](https://react.dev/learn/writing-markup-with-jsx) syntax.

## How is this different?

- API helps you think about app structure in terms of state
- Avoids hiding inner workings of the framework or the DOM
- Routing and logging are baked in
- Front-end state management is always spaghetti; stores help you make a carbonara

## Concepts

- App
  - Main view and routes (link to routing section for details)
- Readable & Writable
  - Overview
    - App is defined as a set of core data from which everything else is defined
    - Methods of controlling access to this core data from various places in the app
  - writable
  - readable
  - computed
  - unwrap
- Views
  - Markup
  - Props
  - Context
    - Using stores
  - Dynamic content (`cond`, `repeat`, `computed` with element values)
  - Lifecycle
- Stores
  - Built-in stores
  - Defining and registering your own stores
    - Context
      - Using other stores
- Transitions & Animation
  - Spring
  - Transition lifecycle (beforeConnect/beforeDisconnect)

### App

```jsx
import { createApp } from "borf";

const app = createApp({
  // Debug options control what gets printed from messages logged through view and store contexts.
  debug: {
    // A comma-separated list of filters. '*' means allow everything and '-borf/*' means suppress messages with labels beginning with 'borf/'.
    filter: "*,-borf/*",

    // Never print ctx.info() messages
    info: false,

    // Only print ctx.log() and ctx.warn() messages in development mode
    log: "development",
    warn: "development",

    // Always print ctx.error() messages
    error: true,
  },

  // Router options control how routes are matched
  router: {
    hash: true, // Use hash-based routing
  },

  mode: "development", // or "production" (enables additional debug features and logging in "development")
});
```

#### Main View, Routes and Outlets

The main view (defined with the app's `main` method) is the top-level view that will always be displayed while the app is connected.

```jsx
// Here is a hypothetical main view with a layout and navigation:
app.main((props, ctx) => {
  return (
    <div className="todo-layout">
      <nav>
        <ul>
          <li>
            <a href="/tasks">Tasks</a>
          </li>
          <li>
            <a href="/completed">Completed</a>
          </li>
        </ul>
      </nav>
      {/*
       * An outlet is where children of a view are shown.
       * Because this is a main view, children in this case
       * are the views that correspond to matched routes.
       */}
      {ctx.outlet()}
    </div>
  );
});

// Here are a couple of routes to be rendered into our layout:
app.route("/tasks", TasksView);
app.route("/completed", CompletedView);
```

Routes can also be nested. Just like the main view and its routes, subroutes will be displayed in the outlet of their parent view.

```jsx
app.route("/tasks", TasksView, (sub) => {
  sub.route("/", TaskListView);

  // In routes, `{value}` is a dynamic value that matches anything,
  // and `{#value}` is a dynamic value that matches a number.
  sub.route("/{#id}", TaskDetailsView);
  sub.route("/{#id}/edit", TaskEditView);

  // If the route is any other than the ones defined above, redirect to the list.
  // Redirects support './' and '../' style relative paths.
  sub.redirect("*", "./");
});
```

> TODO: Show how to access route params. This requires some explanation of stores and views first.

### Views

Views are how you create and manage DOM nodes. Views encapsulate state, logic and markup that can be reused. If you've ever dabbled in other JavaScript frameworks you may know this concept as a component.

At its most basic, a view is a function that returns Markup elements.

```jsx
function ExampleView() {
  return <h1>Hello World!</h1>;
}
```

Markup elements are created with JSX or the `m` function. These elements are not actual DOM nodes yet, but they are used as a template to create real nodes before the view is connected.

#### Markup

Markup looks a lot like HTML. But while HTML is its own language that is parsed into a DOM, Markup is shorthand for constructing the DOM nodes directly. Instead of HTML attributes, you are passing DOM properties.

Here is an example to give you a better idea of what's happening when you write Markup; the two pieces of code below are equivalent:

```jsx
// With Markup:
function ExampleView() {
  return (
    <div className="container">
      <h1 style={{ fontSize: "24px" }}>Hello!</h1>

      <p>This is a really simple view.</p>

      <button
        onClick={() => {
          alert("You clicked me!");
        }}
      >
        Click me!
      </button>
    </div>
  );
}
```

```jsx
// With DOM APIs (by the way, you can do this if you really want to; there is a time and place):
function ExampleView() {
  const div = document.createElement("div");
  div.className = "container";

  const h1 = document.createElement("h1");
  h1.style.fontSize = "24px";
  h1.appendChild(document.createTextNode("Hello!"));

  const p = document.createElement("p");
  p.appendChild(document.createTextNode("This is a really simple view."));

  const button = document.createElement("button");
  button.addEventListener("click", () => {
    alert("You clicked me!");
  });
  button.appendChild(document.createTextNode("Click me!"));

  div.appendChild(h1);
  div.appendChild(p);
  div.appendChild(button);

  return div;
}
```

Markup does a few other things for you over the manual approach, such as handling dynamic data, which you can read about in [Readables &amp; Writables]().

<details>
  <summary><h4>Alternate ways of writing Markup</h4></summary>

Markup can also be created with the `m` function if you prefer to run your JavaScript code directly in the
browser without a build step.

```js
import { m } from "borf";

function ExampleView() {
  // Arguments are (tag, props, ...children) or (tags, props, [...children])
  return m("div", { className: "container" }, [
    m("h1", { style: { fontSize: "24px" } }, "Hello!"),
    m("p", null, "This is a really simple view."),
    m(
      "button",
      {
        onClick: () => {
          alert("You clicked me!");
        },
      },
      "Click me!"
    ),
  ]);
}
```

Another option is the [`htm`](https://github.com/developit/htm) package which binds the `m` function
and allows you to write in a JSX-like syntax that runs in the browser.

```js
import htm from "htm";
import { m } from "borf";

const html = htm.bind(m);

function ExampleView() {
  return html`
    <div className="container">
      <h1 style=${{ fontSize: "24px" }}>Hello!</h1>
      <p>This is a really simple view.</p>
      <button
        onClick=${() => {
          alert("You clicked me!");
        }}
      >
        Click me!
      </button>
    </div>
  `;
}
```

</details>

#### View Props

A view function takes a `props` object as its first argument. This object contains all properties passed to the view when it's invoked.

```jsx
function ListView() {
  return (
    <ul>
      <ListItemView label="Squirrel" />
      <ListItemView label="Chipmunk" />
      <ListItemView label="Groundhog" />
    </ul>
  );
}

function ListItemView(props) {
  return <li>{props.label}</li>;
}
```

#### View Context

A view function takes a context object as its second argument. The context provides a set of functions you can use to respond to lifecycle events, observe dynamic data, print debug messages and display child elements among other things.

##### Printing Debug Messages

```jsx
function ExampleView(props, ctx) {
  // Set the name of this view's context. Console messages are prefixed with name.
  ctx.name = "CustomName";

  // Print messages to the console. These are suppressed by default in the app's "production" mode.
  // You can also change which of these are printed and filter messages from certain contexts in the `createApp` options object.
  ctx.info("Verbose debugging info that might be useful to know");
  ctx.log("Standard messages");
  ctx.warn("Something bad might be happening");
  ctx.error("Uh oh!");

  // If you encounter a bad enough situation, you can halt and disconnect the entire app.
  ctx.crash(new Error("BOOM"));

  return <h1>Hello World!</h1>;
}
```

##### Lifecycle Events

```jsx
function ExampleView(props, ctx) {
  ctx.beforeConnect(() => {
    // Do something before this view's DOM nodes are created.
    // If this callback returns a Promise, this view will not be connected until the Promise resolves.
  });

  ctx.onConnected(() => {
    // Do something immediately after this view is connected to the DOM.

    // Schedule a callback to be run in the app's next update batch.
    // Use this when manually manipulating DOM nodes to avoid layout thrashing.
    ctx.queueUpdate(() => {
      // Manipulate DOM nodes.
    });
  });

  ctx.beforeDisconnect(() => {
    // Do something before removing this view from the DOM.
    // If this callback returns a Promise, the view will not be disconnected until the Promise resolves.
  });

  ctx.onDisconnected(() => {
    // Do some cleanup after this view is disconnected from the DOM.
  });

  return <h1>Hello World!</h1>;
}
```

##### Displaying Children

The context object is has an `outlet` function that can be used to display children at a location of your choosing.

```js
function LayoutView(props, ctx) {
  return (
    <div className="layout">
      <OtherView />
      <div className="content">{ctx.outlet()}</div>
    </div>
  );
}

function ExampleView() {
  // <h1> and <p> are displayed inside LayoutView's outlet.
  return (
    <LayoutView>
      <h1>Hello</h1>
      <p>This is inside the box.</p>
    </LayoutView>
  );
}
```

##### Using Stores

```jsx
import { UserStore } from "../stores/UserStore.js";

function ExampleView(props, ctx) {
  const { $name } = ctx.getStore(UserStore);

  return <h1>Hello {$name}!</h1>;
}
```

##### Observing Data

The `observe` function starts observing when the view is connected and stops when disconnected. This takes care of cleaning up observers so you don't have to worry about memory leaks.

```jsx
function ExampleView(props, ctx) {
  const { $someValue } = ctx.getStore(SomeStore);

  ctx.observe($someValue, (value) => {
    ctx.log("someValue is now", value);
  });

  return <h1>Hello World!</h1>;
}
```

### Stores

A store is a function that returns a plain JavaScript object. If this store is registered on the app, a single instance of the store is shared across all views and stores in the app. If the store is registered using a `StoreScope`, a single instance of the store is shared amongst all child elements.

Stores are accessed with the `use` function available on the context object in views and other stores.

Stores are helpful for managing persistent state that needs to be accessed in many places.

```js
import { createApp } from "borf";

const app = createApp();

// We define a store that just exports a message.
function MessageStore() {
  return {
    message: "Hello from the message store!",
  };
}

// Register it on the app.
app.store(MessageStore);

// All instances of MessageView will share just one instance of MessageStore.
function MessageView(props, ctx) {
  const store = ctx.getStore(MessageStore);

  return <p>{store.message}</p>;
}

// And a layout view with five MessageViews inside.
function LayoutView() {
  return (
    <div>
      <h1>Title</h1>
      <MessageView />
      <MessageView />
      <MessageView />
      <MessageView />
      <MessageView />
    </div>
  );
}

// Use LayoutView as the app's main view.
app.main(LayoutView);

// Connect the app.
app.connect("#app");
```

The output:

```html
<div id="app">
  <div>
    <h1>Title</h1>
    <p>Hello from the message store!</p>
    <p>Hello from the message store!</p>
    <p>Hello from the message store!</p>
    <p>Hello from the message store!</p>
    <p>Hello from the message store!</p>
  </div>
</div>
```

#### StoreScope

Stores relevant to only a part of the view tree can be scoped using a `StoreScope`.

```jsx
function ExampleStore() {
  return { value: 5 };
}

function ExampleView(props, ctx) {
  const store = ctx.getStore(ExampleStore);

  return <div>{store.value}</div>;
}

function LayoutView() {
  return (
    <StoreScope store={ExampleStore}>
      <ExampleView />
    </StoreScope>
  );
}
```

### Readables &amp; Writables

Borf has no virtual DOM or re-rendering cycle _per se_. Views and state are created once and everything beyond that is a side effect of a
state change. All data that can change over the lifetime of the app is stored in a wrapper object called a Readable or a Writable.
Unlike many other frameworks, you work directly with these container objects. You create them, update them, derive other states from them, and pass them as props.

By storing values in these containers, and slotting these containers into your DOM nodes, those elements which are directly affected by that data
can observe changes to it and update themselves accordingly.

> Borf's convention is dollar signs at the start of variable names to mark them as dynamic. A `$single` means Readable
> and a `$$double` means Writable. Another way to think of this is that `$` represents how many 'ways' the binding goes;
> one-way (`$` = read only) or two-way (`$$` = read-write).

#### Readable

An object implements the Readable protocol when:

- It has a `get` method that takes no arguments and returns a stored value.
- It has an `observe` method that takes a callback and returns a stop function.
  - The callback is called immediately with the stored value.
  - The callback is called again with the new stored value any time the value is changed.
  - The callback is never called again after the stop function is called.

The main way of creating a readable is the `readable()` function.

```js
import { readable } from "borf";

const $count = readable(42);
```

The `computed()` function also returns a readable.

```js
import { readable, computed } from "borf";

const $count = readable(42);
const $doubled = computed($count, (value) => value * 2);
```

#### Writable

An object implements the Writable protocol when:

- It implements the Readable protocol.
- It has a `set` method that takes a new value to store and returns nothing.
- It has an `update` method that takes a callback and returns nothing.
  - The callback is called once with the current stored value. The return value of the callback becomes the new stored value.

The main way of creating a writable is the `writable()` function.

```js
const $$count = writable(42);
```

#### Example: Counter View

In this example, we have a view that maintains a counter. The user sees the current count displayed, and below it three buttons; one to increment by 1, one to decrement by 1, and one to reset the value to 0.

```jsx
import { writable } from "borf";

function CounterView(props, ctx) {
  const $$count = writable(0);

  function increment() {
    $$count.update((n) => n + 1);
  }

  function decrement() {
    $$count.update((n) => n - 1);
  }

  function reset() {
    $$count.set(0);
  }

  return (
    <div>
      <p>The count is {$$count}</p>
      <div>
        <button onClick={increment}>+1</button>
        <button onClick={decrement}>-1</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
```

Any Markup property can take a Readable. The `<input>` element even has a special behavior; the `$$value`
property is automatically two-way bound when passed a Writable.

In the following example, typing in the input box immediately updates the text in the `<p>` tag above it.

```jsx
import { writable } from "borf";

function ExampleView(props, ctx) {
  const $$value = writable("User");

  return (
    <div>
      <p>Hello, {$$value}!</p>

      <div>
        <label for="name-input">Your Name Here</label>
        <input id="name-input" $$value={$$value} />
      </div>
    </div>
  );
}
```

#### Computed Readables

The `computed` function can take one or more readables and derive a new value from them. This value is recomputed each time the source readables change. By computing values, you can
extrude your core data into whatever shape you need for views. Only the core data remains writable, and everything else
stays in sync.

```js
import { writable, computed } from "borf";

const $$number = writable(152);
const $doubled = computed($$number, (value) => value * 2);
const $quadrupled = computed($doubled, (value) => value * 2);

console.log($doubled.get()); // 304
console.log($quadrupled.get()); // 608

$$number.set(250);

console.log($doubled.get()); // 500
console.log($quadrupled.get()); // 1000
```

### Dynamic Views

We have established that views are only called once. We have established that dynamic values are stored in Readables and
Writables so they can change after that initial setup. Naturally, any changes to what a view displays after setup also
has to be the result of data stored in a Readable or Writable.

The `borf` package has a set of four functions that handle conditionals, loops and more off-the-wall rendering
needs based on the values of a Readable or Writable.

```jsx
import { Writable, when, unless, repeat, computed } from "@borf/browser";

function PizzaBuilderView(props, ctx) {
  const $$toppings = writable(["Pineapple", "Jalapeño", "Sausage"]);
  const $$showToppingInput = writable(false);
  const $$tempTopping = writable("");

  const addTopping = () => {
    $$toppings.update((toppings) => {
      return [...toppings, $$tempTopping.get()];
    });
    $$tempTopping.set("");
    $$showToppingInput.set(false);
  };

  return (
    <div>
      {computed($$toppings, (toppings) => {
        // Re-rendered each time $$toppings changes.
        // This can return anything that can normally be rendered by a view.
        // Beware that everything here is torn down and rebuilt each and every time the value changes.
        return `Your pizza has ${toppings.length} toppings: ${toppings.join(" and ")}.`;
      })}

      <section>
        <header>
          <h2>Current Toppings</h2>
        </header>
        <ul>
          {repeat(
            $$toppings,

            // The key function takes the item and returns a string or number to uniquely identify it
            (t) => t,

            // The render function takes the value and index as readables, and its own view context.
            ($topping, $index, ctx) => {
              const removeTopping = () => {
                $$toppings.update((toppings) => {
                  const index = $index.get();
                  return toppings.filter((t, i) => i !== index);
                });
              };

              return (
                <li>
                  #{$index}: {$topping}
                  <button onClick={removeTopping}>Remove</button>
                </li>
              );
            }
          )}
        </ul>

        {cond(
          $$showToppingInput,

          // Show form when truthy
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTopping();
            }}
          >
            <input $$value={$$tempTopping} />
          </form>,

          // Show button when falsy
          <button
            onClick={() => {
              $$showToppingInput.set(true);
            }}
          >
            Add Topping
          </button>
        )}
      </section>
    </div>
  );
}
```

#### Routing

`borf` makes heavy use of client-side routing. You can define as many routes as you have views, and the URL
will determine which one the app shows at any given time. By building an app around routes, lots of things one expects
from a web app will just work; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Borf is aesthetically inspired by [choo.js](https://www.choo.io/docs/routing)
with technical inspiration from [@reach/router](https://reach.tech/router/), as routes are matched by highest
specificity regardless of the order they were registered. This avoids some confusing situations that come up with
order-based routers like that of `express`. On the other hand, order-based routers can support regular expressions as
patterns which Borf's router cannot.

#### Route Patterns

Routes are defined with strings called patterns. A pattern defines the shape the URL path must match, with special
placeholders for variables that appear within the route. Values matched by those placeholders are parsed out and exposed
to your code (`router` store, `$params` readable). Below are some examples of patterns and how they work.

- Static: `/this/is/static` has no params and will match only when the route is exactly `/this/is/static`.
- Numeric params: `/users/{#id}/edit` has the named param `{#id}` which matches numbers only, such as `123` or `52`. The
  resulting value will be parsed as a number.
- Generic params: `/users/{name}` has the named param `{name}` which matches anything in that position in the path. The
  resulting value will be a string.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that in params
  as `wildcard`. `*` is valid only at the end of a route.

Now, here are some route examples in the context of an app:

```js
import { PersonDetails, ThingIndex, ThingDetails, ThingEdit, ThingDelete } from "./components.js";

const app = createApp();

app
  .route("/people/{name}", PersonDetails)

  // Routes can be nested. Also, a `null` component with subroutes acts as a namespace for those subroutes.
  // Passing a view instead of `null` results in subroutes being rendered inside that view wherever `ctx.outlet()` is called.
  .route("/things", null, (sub) => {
    sub.route("/", ThingIndex); // matches `/things`
    sub.route("/{#id}", ThingDetails); // matches `/things/{#id}`
    sub.route("/{#id}/edit", ThingEdit); // matches `/things/{#id}/edit`
    sub.route("/{#id}/delete", ThingDelete); // matches `/things/{#id}/delete`
  });
```

As you may have inferred from the code above, when the URL matches a pattern the corresponding view is displayed. If we
visit `/people/john`, we will see the `PersonDetails` view and the params will be `{ name: "john" }`. Params can be
accessed inside those views through the built-in `router` store.

```js
function PersonDetails(props, ctx) {
  // `router` store allows you to work with the router from inside the app.
  const router = ctx.getStore("router");

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
  const $name = computed($params, (p) => p.name);

  // Render it into a <p> tag. The name portion will update if the URL changes.
  return <p>The person is: {$name}</p>;
}
```

---

[🦆](https://www.manyducks.co)
