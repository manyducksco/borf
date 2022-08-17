# @woofjs/client

Front end routing, components and state for dogs. 🐕

`@woofjs/client` is a client-side JavaScript framework that borrows the best ideas from other frameworks; [React](https://reactjs.org/docs/introducing-jsx.html), [Angular](https://angular.io/guide/architecture-services) and [Choo](https://github.com/choojs/choo#routing) in particular. As we go through Woof's concepts in this readme, I'll point out some places you may have seen these ideas before.

## Table of Concepts

1. [Routing](#routing)
2. [States](#reactivity-with-states)
3. [Components](#components)
4. [Services](#services)

## Hello World

```js
import { makeApp, h } from "@woofjs/client";

const app = makeApp();

// Render <h1>Hello World</h1> regardless of the URL
app.route("*", function () {
  return h("h1", "Hello World");
});

// Render the matched route in an element with an id of `#app`
app.connect("#app");
```

## Routing

At the top level, woof determines what component to display using routes. Routes "match" when the pathname of the current URL fits a pattern. When a route matches, that route's component is displayed.

You'll notice that even a simple Hello World requires us to set up a route. Routing is central to what the web is. By following this convention several things users expect from a web app will just work out of the box; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Woof is heavily inspired by [choo.js](https://www.choo.io/docs/routing) and [@reach/router](https://reach.tech/router/).

### Route Matching

Route strings are a set of fragments separated by `/`. These fragments are of three types.

- Static: `/this/is/static` and will match only when the route is exactly `/this/is/static`.
- Dynamic: `/users/:id/edit` will match anything that fits the static parts of the route and stores the parts beginning with `:` as named params. This can be anything, like `/users/123/edit` or `/users/BobJones/edit`. You can access these values inside the component.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that as a `wildcard` param. Wildcards must be at the end of a route.

```js
app.route("users/:id", function () {
  // Get route params from router.
  const { $params } = this.services.router;

  // Get the live value of :id with '.map()'.
  const $id = $params.map("id");

  // Render it into a <p> tag. The ID portion will update if the URL changes.
  return h("p", "User's ID is ", $id);
});
```

> TODO: Describe nested routing

## Reactivity with States

Unlike many other frameworks Woof does _not_ use a virtual DOM. Instead, Woof uses objects called States to hold data which needs to change. States are sprinkled into your components, binding their data to the elements where that data is needed. When the value of a State gets updated, any DOM nodes bound to that state are immediately updated to match. No other processing is needed.

```js
import { makeComponent, makeState } from "@woofjs/client";

const Timer = makeComponent((self) => {
  // Naming states with a $ is a convention to help point out that they are dynamic.
  // Anywhere you see $seconds used you know that value can change.
  const $seconds = makeState(0);

  // Adds 1 to the current value of $seconds.
  function increment() {
    $seconds.set(value => value + 1);
  }

  // Resets $seconds to 0.
  function reset() {
    $seconds.set(0);
  }

  // Increment once per second after the component is connected to the DOM.
  self.afterConnect(() => {
    setInterval(increment, 1000);
  });

  return (
    <div>
      <input type="text" value={$seconds} disabled>
      <button onclick={reset}>Reset Counter</button>
    </div>
  );
});
```

[Read more about states](./src/state/README.md)

## Components

Components are reusable modules with their own markup and logic. You can define a component once and reuse it as many times as you need. Components can take inputs called attributes that can be accessed inside the component to change how they behave or what they display.

Components are ubiquitous in front-end frameworks, but Woof's take on them is very inspired by how [React](https://reactjs.org/docs/components-and-props.html) does things.

```js
const Example = makeComponent(function () {
  const $title = this.$attrs.map("title");

  return h("div", [
    h("h1", $title),
    h("p", "This is a reusable component.")
  ]);
});

// Components can be mounted directly on a route.
app.route("example", Example);

// They can also be used in the body of another component.
app.route("other", function () {
  return h("div", [
    // Pass attributes in an object just like regular HTML elements
    h(Example, { title: "In Another Component" })

    // You can also use components with JSX like so:
    <Example title="In Another Component">
  ]);
});
```

### Component Context

Component functions have a context object bound to `this` from inside the function body.

```js
const Example = makeComponent(function () {
  // Access services by the name they were registered under.
  const service = this.services.name;

  // Print debug messages
  this.debug.name = "component:Example"; // Prefix messages in the console to make tracing easier at a glance.
  this.debug.log("Something happened.");
  this.debug.warn("Something happened!");
  this.debug.error("SOMETHING HAPPENED!!!!");

  // Helpers are available on the component context as well as exported from `@woofjs/client`.
  // Use these whenever you want to avoid import statements, such as when writing a library or when not using a build system.
  const { h, when, unless, watch, repeat, bind, makeState, makeProxyState, mergeStates } = this.helpers;

  /*=================================*\
  ||   Component Lifecycle Methods   ||
  \*=================================*/

  this.isConnected; // true if component is connected

  this.beforeConnect(() => {
    // Runs when the component is about to be (but is not yet) added to the page.
  });

  this.afterConnect(() => {
    // Runs after the component is added to the page.
  });

  this.beforeDisconnect(() => {
    // Runs when the component is about to be (but is not yet) removed from the page.
  });

  this.afterDisconnect(() => {
    // Runs after the component is removed from the page.
  });

  this.transitionOut(() => {
    return new Promise((resolve) => {
      // Runs when the component is about to leave the DOM.
      // Delays disconnection and 'afterDisconnect' hook until the promise resolves.
      // Use this to set up an exit animation.

      setTimeout(resolve, 500);
    });
  });

  // Runs a callback function each time an observable emits a value while this component is connected.
  this.subscribeTo($title, (title) => {
    console.log("title attribute changed to " + title);
  });

  /*=================================*\
  ||            Children             ||
  \*=================================*/

  // Access the component's children with `this.children`,
  // in this case to render them inside a <div>
  return h("div", this.children);
});
```

This context object is also passed as the first parameter in case you're using arrow functions, which don't bind `this`.

```js
const ArrowExample = (self) => {
  self.debug.name = "component:ArrowExample";

  self.beforeConnect(() => {
    self.debug.log("Connected");
  });

  // ... etc ... //

  return h("div", self.children);
};
```

### Templating

To create elements in woof, you import the `h` function. The `h` function is heavily based on [hyperscript](https://github.com/hyperhype/hyperscript). There are also helpful utility functions for conditionals, loops and more.

```js
import { h } from "@woofjs/client";

function Example() {
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
    ]);
  ])
};
```

That component renders the following HTML.

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

Woof supports JSX, so if you want to write your components as HTML to begin with you totally can. However, it's important to understand how `h` works because that's ultimately what the JSX compiles down to. JSX is simply an alternate syntax for `h`.

> Note that Woof uses a `class` attribute like HTML rather than `className` like React.

```jsx
function Example() {
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
}
```

### Using components

Using a component is the same as creating an HTML element, but you call `$` with the component instead of a tag name.

```js
function Example() {
  return h(Subcomponent);
});

function Subcomponent() {
  return h("h1", "Hello from inside another component!");
};
```

When using subcomponents, you can pass them attributes just like you can with HTML elements. The Example component in the following code will display `<h1>Hello world!</h1>`.

```js
function Example() {
  return h(Subcomponent, { name: "world" });
});

function Subcomponent() {
  const name = this.$attrs.get("name");

  return h("h1", "Hello ", name, "!");
};
```

The same thing with JSX:

```js
function Example() {
  return <Subcomponent name="world" />
});

function Subcomponent() {
  const name = this.$attrs.get("name");

  return <h1>Hello {name}!</h1>
};
```

### Helpers

The `h` function supports creating elements and binding data to them. Helpers supply the control flow you would expect like conditionals and loops.

#### Conditionals (`when` and `unless`)

> `when($condition, element)`
>
> `unless($condition, element)`

The `when` helper displays the element only when the condition is truthy while `unless` displays the element only when the condition is falsy. The condition can be a plain value or a $state.

```js
import { makeState, when, unless } from "@woofjs/client";

function Example() {
  const $on = makeState(false);

  function toggle() {
    $on.set(on => !on);
  }

  return h("div", [
    when($on, h("h1", "Is On")),
    unless($on, h("h1", "Is Off")),

    h("button", { onclick: toggle }, "Toggle")
  ]);
});
```

#### Looping (`repeat`)

> `repeat($list, component)`

Renders a component once for each item in an array. If the array is stored inside a $state the list will update whenever that $state is updated.

```js
import { makeState, repeat } from "@woofjs/client";

function Example() {
  const $list = makeState(["one", "two", "three"]);

  return h(
    "ul",

    // Render once for each item in $list. Updates when $list changes.
    repeat($list, function () {
      const $value = this.$attrs.map((attrs) => attrs.value);

      // Return an <li> that contains the current value of this $list item.
      return h("li", $value);
    })
  );
}
```

The `repeat` function uses keys to identify which items have been changed, added or removed. By default, `repeat` uses the value itself as a key. You must specify a key yourself if your array might have two or more identical values. If you're looping through an array of objects with unique IDs, you will usually want to use the object's ID as the key.

If you'd like to specify the key you can pass a function as the third argument:

```js
// Use the list item's `id` field as the key.
repeat($list, Component, (item, index) => item.id);
```

#### watch

> `watch($state, renderFn)`

Calls a render function whenever the state changes and displays the return value.

```js
import { makeState, watch } from "@woofjs/client";

function Example() {
  const $value = makeState("one");

  return h(
    "div",

    // Displays the return value of the function each time the value changes.
    watch($value, (value) => {
      return <span>{value}!!!</span>;
    })
  );
}
```

#### Two Way Binding (`bind`)

> bind($state[, event])

Creates a two-way binding to a state. When this bound state is passed to the `value` attribute on an input element, the state will be updated whenever the input's value changes.

```js
import { makeState, bind } from "@woofjs/client";

function Example() {
  const $value = makeState("");

  // Displays what the user typed above the text input.
  return (
    <div>
      <p>You typed: {$value}</p>

      <input type="text" value={bind($value)} />
    </div>
  );
}
```

## Dynamic Classes

Components also support dynamic classes. Pass an object where the keys are the class names, and the classes are added to the element while the values are truthy. The values can be $states if you want to toggle classes dynamically.

```jsx
function Example() {
  return (
    <div
      class={{
        // Always includes "container" class
        container: true,

        // Includes "active" class when 'isActive' attribute is truthy
        active: this.$attrs.map("isActive"),
      }}
    >
      {this.children}
    </div>
  );
}
```

Multiple classes:

```jsx
function Example() {
  return <div class={["one", "two"]}>{this.children}</div>;
}
```

A combination:

```jsx
function Example() {
  // The 'container' class is always included while the ones
  // inside the object are shown if their value is truthy.
  return (
    <div
      class={["container", {
        active: this.$attrs.map("isActive"),
      }}
    >
      {this.children}
    </div>
  );
};
```

## Services

Services are also a central feature of [Angular](https://angular.io/guide/architecture-services).

Services are a great way to share state and logic between multiple components. Usually, parent components can pass state down to children in the form of attributes. Sometimes you have components in different heirarchies that don't easily support this, such as when you need to access the same data from different pages.

Services are singletons, meaning only one copy of the service exists per app, and all `.getService(name)` calls get the same instance of `name`.

The following example shows a counter with one page to display the number and another to modify it. Both routes share data through a `counter` service.

```js
// The `counter` service holds the current count and provides methods for incrementing and decrementing.
app.service("counter", function () {
  const $count = makeState(0);

  return {
    $current: $count.map(), // Makes a read only version. Components can only change this through the methods.

    increment() {
      $count.set((current) => current + 1);
    },

    decrement() {
      $count.set((current) => current - 1);
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

// The view route displays the count but doesn't let the user change it.
app.route("/counter/view", function () {
  const { $current } = this.services.counter;

  return <h1>The Count is Now {$current}</h1>;
});

// The controls route lets the user change the count but doesn't display it.
app.route("/counter/controls", function () {
  const { increment, decrement } = this.services.counter;

  return (
    <div>
      <button onclick={increment}>Increment</button>
      <button onclick={decrement}>Decrement</button>
    </div>
  );
});
```

### Service Context

```js
app.service("example", function () {
  // Access other services by the name they were registered under.
  // The service being accessed must have been registered before this one or the app will throw an error.
  const service = this.services.name;

  // Print debug messages
  this.debug.name = "service:example"; // Prefix messages in the console to make tracing easier at a glance.
  this.debug.log("Something happened.");
  this.debug.warn("Something happened!");
  this.debug.error("SOMETHING HAPPENED!!!!");

  // Helpers are available on the service context as well as exported from `@woofjs/client`.
  // Use these whenever you need to avoid import statements, such as when not using a build system.
  const { makeState, mergeStates, makeProxyState } = this.helpers;

  /*=================================*\
  ||    Service Lifecycle Methods    ||
  \*=================================*/

  this.beforeConnect(() => {
    // Runs when the service is about to be (but is not yet) initialized, before any routing occurs.
  });

  this.afterConnect(() => {
    // Runs after the app is connected, initial route has been matched, and the first component is added to the page.
  });

  // Services live for the lifetime of the app, so they have no disconnect hooks.

  // Runs a callback function each time a state changes (or any observable emits a value).
  this.subscribeTo($title, (title) => {
    console.log("title attribute changed to " + title);
  });

  // All services must return an object.
  return {};
});
```

## Testing

See [the testing README](./src/testing/README.md).

---

🦆
