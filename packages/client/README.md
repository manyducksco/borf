# @woofjs/client

Front end routing, components and state for dogs. 🐕

`@woofjs/client` is a client-side JavaScript framework that shamelessly steals the best ideas from other frameworks; [React](https://reactjs.org/docs/introducing-jsx.html), [Angular](https://angular.io/guide/architecture-services), [Choo](https://github.com/choojs/choo#routing), and [Vue](https://vuejs.org/v2/guide/class-and-style.html) in particular.

## Hello World

```js
import { makeApp } from "@woofjs/client";

const app = makeApp();

app.routes((when) => {
  when("*", ($) => {
    return $("h1", "Hello World");
  });
});

app.connect("#app");
```

The code above renders an `<h1>` with the words "Hello World" into an element with an ID of `#app`, regardless of the current URL.

## Routing

Woof determines what content to show using routes. Routes take a string to match against the current URL and a component to display when that route matches.

Route strings are a set of fragments separated by `/`. These fragments are of three types.

- Static: `/this/is/static` and will match only when the route is exactly this.
- Dynamic: `/users/:id/edit` will match anything that fits the static parts of the route and stores the parts beginning with `:` as named params. This can be anything, like `/users/123/edit` or `/users/BobJones/edit`. You can access these values inside the component.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that as a `wildcard` param. Wildcards must be at the end of a route.

```js
when("users/:id", ($, self) => {
  const id = self.$route.get("params.id");

  return $("p", ["User ID is ", id]);
});
```

```js
when("users/*", ($) => {
  return $("div", [
    $("h1", "Persistent Header"),

    $.routes((when) => {
      when(":id", ($) => {
        return <p>User Details</p>;
      });
      when(":id/edit", ($) => {
        return <p>User Edit</p>;
      });
      when("*", ($) => {
        return <p>Fallback</p>;
      });
    }
  ]);

//   return (
//     <div>
//       <h1>Persistent Header</h1>
//
//       {$.routes((when) => {
//         when(":id", ($) => {
//           return <p>User Details</p>;
//         });
//         when(":id/edit", ($) => {
//           return <p>User Edit</p>;
//         });
//         when("*", ($) => {
//           return <p>Fallback</p>;
//         });
//       }}
//     </div>
//   );
});
```

## Reactivity

> TODO

See [@woofjs/state](https://github.com/woofjs/state). Pass a state instead of a static value for any attribute and the DOM will update automatically as the state changes.

## Dolla

```js
when("users/:id", ($, self) => {
  return $("main", [
    $("p", "Here's some text in a paragraph."),
    $("p", { style: { color: "red" } }, "This paragraph is red."),
  ]);
});
```

## Components

```js
const Example = makeComponent(($, self) => {
  const $title = self.$attrs.map("title");

  return $("div", [
    $("h1", $.text($title, "Default Title"),
    $("p", "This is a reusable component now.")
  ]);
});

app.routes((when) => {
  // Mount directly on a route
  when("example", Example);

  // Use in the body of another component
  when("other", ($) => {
    return $("div", [
      $(Example, { title: "In Another Component" })
    ]);

    // return (
    //   <div>
    //     <Example title="In Another Component" />
    //   </div>
    // );
  });
});
```

## Services

Services are singletons, meaning only one copy of the service exists and all `.getService(name)` calls that access it get the same instance of `name`. You can use services to store state in a central location when you need to get to it from multiple places in your app.

The following example shows a counter with one page to display the number and another to modify it. Both routes share data through a `counter` service.

```js
app.service("counter", () => {
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

app.routes((when) => {
  when("/counter", ($) => {
    // return $("div", [
    //   $("h1", "World's Most Inconvenient Counter Demo"),
    //   $("a", { href: "/counter/view" }, "See the number"),
    //   $("a", { href: "/counter/controls" }, "Change the number"),
    // ]);

    return (
      <div>
        <h1>World's Most Inconvenient Counter Demo</h1>
        <a href="/counter/view">See the number</a>
        <a href="/counter/controls">Change the number</a>
      </div>
    );
  });

  when("/counter/view", ($, self) => {
    const { $current } = self.getService("counter");

    // return $("h1", ["The Count is Now ", $.text($current, "0")]);

    return <h1>The Count is Now {$.text($current)}</h1>;
  });

  when("/counter/controls", ($, self) => {
    const { increment, decrement } = self.getService("counter");

    // return $("div", [
    //   $("button", { onclick: increment }, "Increment"),
    //   $("button", { onclick: decrement }, "Decrement"),
    // ]);

    return (
      <div>
        <button onclick={increment}>Increment</button>
        <button onclick={decrement}>Decrement</button>
      </div>
    );
  });
});
```

## Testing

> TO DO

---

🦆
