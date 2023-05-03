# 🖥 Borf: Browser

![bundle size](https://img.shields.io/bundlephobia/min/@borf/browser)
![bundle size](https://img.shields.io/bundlephobia/minzip/@borf/browser)

This is the front-end portion of [Borf](https://www.borfjs.com). It handles things like components, [routing](#routing), data binding, logging, and crash handling, all out-of-the-box, aiming to cover the common needs of modern web apps while striking a balance between features and size.

## About this README

This README is written for web developers and hobbyists with a solid understanding of web browser technologies such as HTML, JavaScript, and the DOM. Related terms are used with little or no explanation. It may be helpful (but not required) to have experience building apps with another framework like React, Angular, or Vue.

Code examples are written using [JSX](https://react.dev/learn/writing-markup-with-jsx) syntax.

## Concepts

Like most other frameworks, `@borf/browser` is built around the idea of _components_. Borf has two types of components&mdash;Views and Stores&mdash;which are both written as functions, and differ only in what kind of value they return and how they can be used within the framework.

### Components: Views

Views return `Markup` objects, which are used to construct and manage a tree of DOM elements. `Markup` objects are typically created by writing JSX.

```js
function LayoutView() {
  return (
    <div>
      <h1>Title</h1>
      <MessageView message="This is passed to OtherView" />
    </div>
  );
}

function MessageView({ message }) {
  return <p>{message}</p>;
}
```

Components don't have direct access to their children. Instead, the `Outlet` component can be used to display children at a location of your choosing.

```js
import { Outlet } from "@borf/browser";

function ContentBox() {
  return (
    <div style={{ padding: "1rem", border: "1px dashed orange" }}>
      <Outlet />
    </div>
  );
}

function LayoutView() {
  return (
    <ContentBox>
      <h1>Hello</h1>
      <p>This is inside the box.</p>
    </ContentBox>
  );
}
```

### Components: Stores

Stores return a plain JavaScript object, a single instance of which is shared amongst child components via the `useStore` hook. Stores don't display anything, but they are useful for scoping common state to a limited area of your component tree.

```js
import { useStore } from "@borf/browser";

function MessageStore() {
  return {
    message: "This is the message",
  };
}

function LayoutView() {
  return (
    <MessageStore>
      <h1>Title</h1>
      <MessageView />
    </MessageStore>
  );
}

function MessageView() {
  const { message } = useStore(MessageStore);

  return <p>{message}</p>;
}
```

### Dynamic State: Readables and Writables

Borf has no virtual DOM or re-rendering. Components are set up once, and everything beyond that is a side effect of a state change. In a Borf app, all data that changes is stored in a Readable or a Writable. By storing values in these containers, and slotting these containers into your DOM nodes, only those elements which are directly affected that change need to update when changes occur.

> Borf's convention is to use dollar signs at the start of variable names to mark them as dynamic. A `$single` sign means Readable and a `$$double` sign means Writable. Another way to think of this is that `$` represents how many 'ways' the binding goes; one-way (read only) or two-way (read-write).

```jsx
import { useStore, Writable } from "@borf/browser";

function CounterStore() {
  const $$counter = new Writable(0);

  return {
    // Expose counter as a Readable.
    // The value can only be changed from outside using the methods below.
    $counter: $$counter.toReadable(),

    increment: () => {
      $$counter.value += 1;
    },
    decrement: () => {
      $$counter.value -= 1;
    },
    reset: () => {
      $$counter.value = 0;
    },
  };
}

function LayoutView() {
  return (
    <div class="layout">
      <CounterStore>
        <CounterView />
      </CounterStore>
    </div>
  );
}

function CounterView() {
  const { $counter, ...methods } = useStore(CounterStore);

  return (
    <div>
      <p>The count is {$counter}</p>
      <div>
        <button onclick={methods.increment}>+1</button>
        <button onclick={methods.decrement}>-1</button>
        <button onclick={methods.reset}>Reset</button>
      </div>
    </div>
  );
}
```

Any HTML attribute can take a Readable. The `<input>` element even has a special behavior with Writables; the input value is automatically two-way bound if you pass a Writable as the `value` attribute.

In the following example, typing in the input box immediately updates the text in the `<p>` tag above it.

```js
import { Writable } from "@borf/browser";

function ExampleView() {
  const $$value = new Writable("Your Name");

  return (
    <div>
      <p>Hello, {$$value}!</p>

      <div>
        <label for="name-input">Your Name Here</label>
        <input id="name-input" value={$$value} />
      </div>
    </div>
  );
}
```

#### Mapped Readables

One of Borf's most important features is the ability to `.map` existing values to create a new ones. By mapping, you can extrude your core data into whatever shape you need it to be for views, only the core data remains writable, and everything else stays in sync.

```js
const $$count = new Writable(152);
const $doubled = $$count.map((value) => value * 2);
const $quadrupled = $doubled.map((value) => value * 2);

console.log($doubled.value); // 304
console.log($quadrupled.value); // 608

$$count.value = 250;

console.log($doubled.value); // 500
console.log($quadrupled.value); // 1000
```

### Dynamic Views

We have established that views are only called once. We have established that dynamic values are stored in Readables and Writables so they can change after that initial setup. Naturally, any changes to what a view displays after setup also has to be the result of data stored in a Readable or Writable.

The `@borf/browser` package has a set of four functions that handle conditionals, loops and more off-the-wall rendering needs based on the values of a Readable or Writable.

```jsx
import { Writable, when, unless, repeat, observe } from "@borf/browser";

function PizzaBuilderView() {
  const $$toppings = new Writable(["Pineapple", "Jalapeño", "Sausage"]);
  const $$showToppingInput = new Writable(false);
  const $$tempTopping = new Writable("");

  const addTopping = () => {
    // This is new; it takes a function that receives the current value and modifies it to derive a new value.
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
          {repeat($$toppings, ($topping, $index) => {
            const removeTopping = () => {
              $$toppings.update((toppings) => {
                toppings.splice($index.value, 1);
              });
            };

            return (
              <li>
                #{$index}: {$topping} <button onclick={removeTopping}>Remove</button>
              </li>
            );
          })}
        </ul>

        {unless(
          $$showToppingInput,
          <button
            onclick={() => {
              $$showToppingInput.value = true;
            }}
          >
            Add Topping
          </button>
        )}

        {when(
          $$showToppingInput,
          <form
            onsubmit={(e) => {
              e.preventDefault();
              addTopping();
            }}
          >
            <input value={$$tempTopping} />
          </form>
        )}
      </section>
    </div>
  );
}
```

### Hooks

> ...

```js
import {
  useName,
  useLoader,
  useConsole,
  useCrash,
  useBeforeConnect,
  useConnected,
  useBeforeDisconnect,
  useDisconnected,
  useObserver,
  useStore,
  useValue,
  useReadable,
  useWritable,
  useMerge,
} from "@borf/browser";
```

### App

> ...

```js
import { App } from "@borf/browser";
```

#### Routing

Most web apps today are what's known as an SPA, or single-page app, consisting of one HTML page with links to bundled app code. This code uses browser APIs to simulate navigation between multiple "pages" by swapping out page content based on the URL, but retains all JavaScript state that would normally be lost between page loads because no actual page loads take place. Despite the illusion of moving around the app, you never actually leave that one HTML page. This technique is generally known as client-side routing.

`@borf/browser` makes heavy use of client-side routing. You can define as many routes as you have views, and the URL will determine which one the app shows at any given time.

By building an app around routes, lots of things we expect from a web app will just work; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Borf is aesthetically inspired by [choo.js](https://www.choo.io/docs/routing)
with technical inspiration from [@reach/router](https://reach.tech/router/), as routes are matched by highest specificity regardless of the order they were registered. This avoids some confusing situations that come up with order-based routers like that of `express`. On the other hand, order-based routers can support regular expressions as patterns which Borf's router cannot.

#### Route Patterns

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
function PersonDetails() {
  // `router` store allows you to work with the router from inside the app.
  const router = useStore("router");

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
