# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/min/@borf/browser)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser)

> WARNING: This package is very early in development. There are frequent breaking changes, many bugs and undocumented
> or incorrectly documented features, and READMEs don't get updated in a timely manner.

This is the front-end portion of [Borf](https://www.borfjs.com). It handles things like components, [routing](#routing),
data binding, logging, and crash handling, all out-of-the-box, aiming to cover the common needs of modern web apps while
striking a balance between features and size.

## About this README

This README is written for web developers and hobbyists with a solid understanding of web browser technologies such as
HTML, JavaScript, and the DOM. Related terms are used with little or no explanation. It may be helpful (but not
required) to have experience building apps with another framework like React, Angular, or Vue.

Code examples are written using [JSX](https://react.dev/learn/writing-markup-with-jsx) syntax.

## Examples

The best way to understand a library is to see it in action. The following examples show what `borf` can do. After the
examples, we'll dig into the concepts in more depth.

### Example: Hello World

The simplest possible app. Displays an `<h1>` inside the element with id `app`.

```js
import { App } from "borf";

const app = new App();

app.main(() => {
  return <h1>Hello World!</h1>;
});

app.connect("#app");
```

### Example: Greeter

A modified Hello World in which the user can change the name through a text input. Demonstrates the use of Writable for
dynamic state.

Any HTML attribute can take a Writable or Readable as a value and will update automatically when its value changes.

```js
import { App, writable } from "borf";

const app = new App();

app.main(() => {
  const $$name = writable("World");

  return (
    <div>
      <h1>Hello {$$name}!</h1>
      <input
        value={$$name}
        onInput={(e) => {
          $$name.set(e.target.value);
        }}
      />
    </div>
  );
});

app.connect("#app");
```

### Example: Counter with Store

A counter that stores a number that can be incremented or decremented using buttons. This example uses a store to keep
that state in one place while it is accessed from multiple views.

```js
import { App, writable, readable } from "borf";

const app = new App();

function CounterStore() {
  const $$count = writable(0);

  return {
    $count: readable($$count),
    increment: () => {
      $$count.update(n => n + 1);
    },
    decrement: () => {
      $$count.update(n => n - 1);
    },
  };
}

app.store(CounterStore);

function Layout() {
  return (
    <div>
      <CounterDisplay/>
      <CounterControls/>
    </div>
  );
}

function CounterDisplay(props, c) {
  const counter = c.use(CounterStore);

  return <h1>{counter.$count}</h1>;
}

function CounterControls(props, c) {
  const counter = c.use(CounterStore);

  return (
    <div>
      <button onClick={counter.increment}>+1</button>
      <button onClick={counter.decrement}>-1</button>
    </div>
  );
}

app.main(Layout);

app.connect("#app");
```

## Concepts

- App
  - Main view
  - Routes (link to routing section)
  - Stores
    - Built-in stores
- Readable & Writable
  - writable
  - readable
  - computed
  - unwrap
- Views
  - Markup
  - Props
  - Context
  - Dynamic content (`cond`, `repeat`, `computed` with element values)
- Stores
  - Context
- Routing
  - Nested routes
- Transitions & Animation
  - Spring
  - Transition lifecycle (beforeConnect/beforeDisconnect)

### App

#### Main view

#### Routes

#### Stores

### Readable & Writable

### Views

#### Markup

Views return `Markup` objects, which represent a tree of DOM nodes. `Markup` objects are typically created by writing
JSX. While JSX looks like HTML, what you are actually passing is DOM node properties.

```js
function ExampleView() {
  return (
    <div className="container">
      <h1 style={{ fontWeight: "bold" }}>Hello!</h1>
      <p>This is a really simple view.</p>
    </div>
  );
}
```

`Markup` objects can also be created with the `m` function if you prefer to run your JavaScript code directly in the
browser without compilation.

```js
import { m } from "borf";

function ExampleView() {
  // Arguments are (tag, props, ...children)
  return m("div", { className: "container" }, [
    m("h1", { style: { fontWeight: "bold" } }, ["Hello!"]),
    m("p", null, ["This is a really simple view."])
  ]);
}
```

Another option is the fantastic [`htm`](https://github.com/developit/htm) library which simply binds the `m` function
and allows you to write in a JSX-like syntax that runs in the browser.

```js
import htm from "htm";
import { m } from "borf";

const html = htm.bind(m);

function ExampleView() {
  return html`
    <div className="container">
      <h1 style=${{ fontWeight: "bold" }}>Hello!</h1>
      <p>This is a really simple view.</p>
    </div>
  `;
}
```

#### TODO: Passing props

#### Displaying Children

Views don't have direct access to their children. Instead, the context object (passed as the second argument to a view
function) has an `outlet` method that can be used to display children at a location of your choosing.

```js
function ContentBox(props, c) {
  return (
    <div
      style={{
        padding: "1rem",
        border: "1px dashed orange",
      }}
    >
      {c.outlet()}
    </div>
  );
}

function ExampleView() {
  return (
    <ContentBox>
      <h1>Hello</h1>
      <p>This is inside the box.</p>
    </ContentBox>
  );
}
```

The output of `ExampleView`:

```html

<div style="padding: 1rem; border: 1px dashed orange">
  <h1>Hello</h1>
  <p>This is inside the box.</p>
</div>
```

### Stores

Stores return a plain JavaScript object, a single instance of which is shared via the `use` method in view and store
contexts. Stores are helpful for keeping persistent state at a specific place in the app for access in many places.

```js
import { App } from "borf";

const app = new App();

// We define a store that just exports a message.
function MessageStore() {
  return {
    message: "Hello from the message store!",
  };
}

// Register it on the app instance.
app.store(MessageStore);

// We define a view that uses our store.
// All instances of MessageView will share just one instance of MessageStore.
function MessageView(props, c) {
  const store = c.use(MessageStore);
  return <p>{store.message}</p>;
}

// And a layout view with five MessageViews inside.
function LayoutView() {
  return (
    <div>
      <h1>Title</h1>
      <MessageView/>
      <MessageView/>
      <MessageView/>
      <MessageView/>
      <MessageView/>
    </div>
  );
}

app.main(LayoutView);

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

### Dynamic State: Readables and Writables

Borf has no virtual DOM or re-rendering. Components are set up once, and everything beyond that is a side effect of a
state change. All data that needs to change is stored in a Readable or a Writable. By storing values in these
containers, and slotting these containers into your DOM nodes, only those elements which are directly affected by that
change update when changes occur.

> Borf's convention is dollar signs at the start of variable names to mark them as dynamic. A `$single` means Readable
> and a `$$double` means Writable. Another way to think of this is that `$` represents how many 'ways' the binding goes;
> one-way (`$` = read only) or two-way (`$$` = read-write).

```jsx
import { writable, readable, StoreProvider } from "borf";

function LayoutView(props, c) {
  return (
    <div class="layout">
      <StoreProvider store={CounterStore}>
        <CounterView />
      </StoreProvider>
    </div>
  );
}

function CounterStore(props, c) {
  const $$current = writable(0);

  return {
    // Expose value as a Readable.
    // The value can only be changed from outside using the methods below.
    $current: readable($$current),

    increment: () => {
      $$current.update(n => n + 1);
    },
    decrement: () => {
      $$current.update(n => n - 1);
    },
    reset: () => {
      $$current.set(0);
    },
  };
}

function CounterView(props, c) {
  // Returns the instance of CounterStore which happens to be the direct parent of CounterView.
  const counter = c.use(CounterStore);

  return (
    <div>
      <p>The count is {counter.$current}</p>
      <div>
        <button onclick={counter.increment}>+1</button>
        <button onclick={counter.decrement}>-1</button>
        <button onclick={counter.reset}>Reset</button>
      </div>
    </div>
  );
}
```

Any HTML attribute can take a Readable. The `<input>` element even has a special behavior with Writables; the input
value is automatically two-way bound if you pass a Writable as the `value` attribute.

In the following example, typing in the input box immediately updates the text in the `<p>` tag above it.

```js
import { Writable } from "@borf/browser";

function ExampleView(props, c) {
  const $$value = new Writable("Your Name");

  return (
    <div>
      <p>Hello, {$$value}!</p>

      <div>
        <label for="name-input">Your Name Here</label>
        <input id="name-input" value={$$value}/>
      </div>
    </div>
  );
}
```

#### Mapped Readables

One of Borf's most important features is the ability to `.map` existing values to create a new ones. By mapping, you can
extrude your core data into whatever shape you need for views. Only the core data remains writable, and everything else
stays in sync.

```js
const $$number = new Writable(152);
const $doubled = $$number.map((value) => value * 2);
const $quadrupled = $doubled.map((value) => value * 2);

console.log($doubled.value); // 304
console.log($quadrupled.value); // 608

$$number.value = 250;

console.log($doubled.value); // 500
console.log($quadrupled.value); // 1000
```

### Dynamic Views

We have established that views are only called once. We have established that dynamic values are stored in Readables and
Writables so they can change after that initial setup. Naturally, any changes to what a view displays after setup also
has to be the result of data stored in a Readable or Writable.

The `@borf/browser` package has a set of four functions that handle conditionals, loops and more off-the-wall rendering
needs based on the values of a Readable or Writable.

```jsx
import { Writable, when, unless, repeat, observe } from "@borf/browser";

function PizzaBuilderView(props, c) {
  const $$toppings = new Writable(["Pineapple", "Jalapeño", "Sausage"]);
  const $$showToppingInput = new Writable(false);
  const $$tempTopping = new Writable("");

  const addTopping = () => {
    // Another way to update values using a function that receives the current value and modifies it.
    $$toppings.update((toppings) => {
      toppings.push($$tempTopping.value);
    });
    $$tempTopping.value = "";
    $$showToppingInput.value = false;
  };

  return (
    <div>
      {observe($$toppings, (toppings) => {
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
            (t) => t,
            ($topping, $index) => {
              const removeTopping = () => {
                $$toppings.update((toppings) => {
                  toppings.splice($index.value, 1);
                });
              };

              return (
                <li>
                  #{$index}: {$topping}
                  <button onclick={removeTopping}>Remove</button>
                </li>
              );
            }
          )}
        </ul>

        {cond(
          $$showToppingInput,

          <form
            onsubmit={(e) => {
              e.preventDefault();
              addTopping();
            }}
          >
            <input value={$$tempTopping} />
          </form>,

          <button
            onclick={() => {
              $$showToppingInput.value = true;
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

### Component Context

> ...

```js
// Full example of a component using everything on its context.
```

### App

> ...

```js
import { App } from "@borf/browser";
```

#### Routing

`@borf/browser` makes heavy use of client-side routing. You can define as many routes as you have views, and the URL
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

As you may have inferred from the code above, when the URL matches a pattern the corresponding view is displayed. If we
visit `/people/john`, we will see the `PersonDetails` view and the params will be `{ name: "john" }`. Params can be
accessed inside those views through the built-in `router` store.

```js
function PersonDetails(_, ctx) {
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
  const $name = $params.map((p) => p.name);

  // Render it into a <p> tag. The name portion will update if the URL changes.
  return <p>The person is: {$name}</p>;
}
```

---

[🦆](https://www.manyducks.co)
