# @woofjs/client

Front end routing, components and state for dogs. 🐕

`@woofjs/client` is a client-side JavaScript framework that borrows the best ideas from other frameworks; [React](https://reactjs.org/docs/introducing-jsx.html), [Angular](https://angular.io/guide/architecture-services) and [Choo](https://github.com/choojs/choo#routing) in particular. As we go through Woof's concepts in this readme, I'll point out some places you may have seen these ideas before.

## Hello World

```js
import { makeApp } from "@woofjs/client";

const app = makeApp();

// Render <h1>Hello World</h1> regardless of the URL
app.route("*", ($) => {
  return $("h1", "Hello World");
});

// Render the matched route in an element with an id of `#app`
app.connect("#app");
```

## Routing

At the top level, woof determines what component to display using routes. Routes "match" when the pathname of the current URL fits its pattern. When a route matches, that route's component is displayed.

You'll notice that even a simple Hello World requires us to set up a route. Routing is central to what the web is. By following this convention several things users expect from a web app will just work out of the box; back and forward buttons, sharable URLs, bookmarks, etc.

Routing in Woof is heavily inspired by [choo.js](https://www.choo.io/docs/routing) and [@reach/router](https://reach.tech/router/).

### Route Matching

Route strings are a set of fragments separated by `/`. These fragments are of three types.

- Static: `/this/is/static` and will match only when the route is exactly this.
- Dynamic: `/users/:id/edit` will match anything that fits the static parts of the route and stores the parts beginning with `:` as named params. This can be anything, like `/users/123/edit` or `/users/BobJones/edit`. You can access these values inside the component.
- Wildcard: `/users/*` will match anything beginning with `/users` and store everything after that as a `wildcard` param. Wildcards must be at the end of a route.

```js
app.route("users/:id", ($, self) => {
  const id = self.get("@route.params.id");

  return $("p", ["User ID is ", id]);
});
```

Nested routes inside a component:

```js
app.route("users/*", ($) => {
  return $("div", [
    $("h1", "Persistent Header"),

    $.router((self) => {
      self.route(":id", ($) => {
        // Displays at '/users/:id'
        return <p>User Details</p>;
      });

      self.route(":id/edit", ($) => {
        // Displays at '/users/:id/edit'
        return <p>User Edit</p>;
      });

      self.route("*", ($) => {
        // Displays at '/users/*' when no other routes match
        return <p>Fallback</p>;
      });
    }
  ]);
});
```

## Reactivity with states

> TODO

See [@woofjs/state](https://github.com/woofjs/state). Pass a state instead of a static value for any attribute and the DOM will update automatically as the state changes.

Woof's biggest difference from most modern frameworks is that it doesn't use a virtual DOM. Instead, Woof apps are data-driven using objects called States, which can be thought of as containers that hold data that needs to change. These States are woven into your app's components, triggering pinpoint changes to the attributes to which they are bound when their values change. This means

States are very similar concept to [signals in Solid.js](https://www.solidjs.com/).

## Services

Services are singletons, meaning only one copy of the service exists and all `.getService(name)` calls that access it get the same instance of `name`. You can use services to store state in a central location when you need to get to it from multiple places in your app.

Services are also a central feature of [Angular](https://angular.io/guide/architecture-services).

The following example shows a counter with one page to display the number and another to modify it. Both routes share data through a `counter` service.

```js
// The `counter` service holds the current count and provides methods for incrementing and decrementing.
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

app.route("/counter", ($) => {
  return (
    <div>
      <h1>World's Most Inconvenient Counter Demo</h1>
      <a href="/counter/view">See the number</a>
      <a href="/counter/controls">Change the number</a>
    </div>
  );
});

// The view route displays the count but doesn't let the user change it.
app.route("/counter/view", ($, self) => {
  const { $current } = self.getService("counter");

  return <h1>The Count is Now {$current}</h1>;
});

// The controls route lets the user change the count but doesn't display it.
app.route("/counter/controls", ($, self) => {
  const { increment, decrement } = self.getService("counter");

  return (
    <div>
      <button onclick={increment}>Increment</button>
      <button onclick={decrement}>Decrement</button>
    </div>
  );
});
```

## Components

```js
const Example = makeComponent(($, self) => {
  const $title = self.map("title");

  return $("div", [
    $("h1", $.text($title, "Default Title"),
    $("p", "This is a reusable component now.")
  ]);
});

// Mount directly on a route
app.route("example", Example);

// Use in the body of another component
app.route("other", ($) => {
  return $("div", [
    // Pass attributes in an object just like regular HTML elements
    $(Example, { title: "In Another Component" })
  ]);
});
```

### Component's `self` Object

```js
const Example = makeComponent(($, self) => {
  // Get an attribute's value.
  const title = self.get("title");

  // Get an attribute's value as a state that updates when the attribute changes.
  const $title = self.map("title");

  // Access services.
  const service = self.getService("name");

  /*=================================*\
  ||   Component Lifecycle Methods   ||
  \*=================================*/

  self.beforeConnect(() => {
    // Runs when the component is about to be (but is not yet) added to the page.
  });

  self.connected(() => {
    // Runs after the component is added to the page.
  });

  self.beforeDisconnect(() => {
    // Runs when the component is about to be (but is not yet) removed from the page.
  });

  self.disconnected(() => {
    // Runs after the component is removed from the page.
  });

  // Runs a callback function each time a state changes while this component is connected.
  self.watchState($title, (title) => {
    console.log("title attribute changed to " + title);
  });

  /*=================================*\
  ||            Children             ||
  \*=================================*/

  // Access the component's children with `self.children`.
  return <div>{self.children}</div>;
});
```

## Templating

The first parameter passed to components is a function called `$` (read 'dolla'). The `$` function creates elements that can be rendered.

### Creating HTML elements

```js
const Example = makeComponent(($, self) => {
  return $("section", [
    $("h1", "Item List"),
    $("p", { style: "color: red" }, "Below is a list of items."),
    $("ul", [
      $("li", "Item 1"),
      $("li", { class: "active" }, "Item 2"),
      $("li", "Item 3"),
      $("li", "Item 4"),
      $("li", "Item 5"),
      $("li", "Item 6"),
    ]);
  ])
});
```

That component is equivalent to the following HTML.

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

Woof supports JSX, so if you want to just write it that way to begin with you totally can. It's important to understand how `$` works because that's ultimately what the JSX compiles to when your app builds.

> Note that Woof uses a `class` attribute like HTML rather than `className` like React.

```jsx
const Example = makeComponent(($, self) => {
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

### Using components

Using a component is the same as creating an HTML element, but you call `$` with the component instead of a tag name.

```js
const Subcomponent = makeComponent(($, self) => {
  return $("h1", "Hello from inside another component!");
});

const Example = makeComponent(($, self) => {
  return $(Subcomponent);
});
```

When using subcomponents, you can pass them attributes just like you can with HTML elements. The Example component in the following code will display `<h1>Hello world!</h1>`.

```js
const Subcomponent = makeComponent(($, self) => {
  const name = self.get("name");

  return $("h1", "Hello ", name, "!");
});

const Example = makeComponent(($, self) => {
  return $(Subcomponent, { name: "world" });
});
```

### Helpers

#### $.if

> `$.if($state[, thenFn][, elseFn])`

Renders the result of `thenFn` when the state holds a truthy value, and the result of `elseFn` otherwise. Pass null or undefined for either if you don't want to display anything for that condition.

```js
const Example = makeComponent(($, self) => {
  const $isOn = useState(false);

  return $.if(
    $isOn,
    () => {
      return <h1>Is On</h1>;
    },
    () => {
      return <h1>Is Off</h1>;
    }
  );
});
```

#### $.each

> `$.each($state, component)`

Renders a component once for each item in an array. If the array is stored inside a $state the list will update whenever that $state is updated.

```js
const Example = makeComponent(($, self) => {
  const $list = makeState(["one", "two", "three"]);

  return $(
    "ul",

    // Render once for each item in $list. Updates when $list changes.
    $.each($list, ($, self) => {
      // Components in an each have unique keys. In this case we're just using the position in the list.
      self.key = self.map("@index");

      // Return an <li> that contains the current value of this $list item.
      return $("li", self.map("@value"));
    })
  );
});
```

#### $.watch

> `$.watch($state, renderFn)`

> TODO

#### $.text

> `$.text($state[, defaultText])`

Displays the value of a state as text. Takes an optional default value to show if the state's value is `null` or `undefined`.

```js
const Example = makeComponent(($, self) => {
  const $count = makeState(null);

  function increment() {
    $count.set((current) => (current == null ? 1 : current + 1));
  }

  return $("div", [
    $("h1", $.text($count, "No Count")),
    $(
      "button",
      {
        onclick: increment,
      },
      "Increment"
    ),
  ]);
});
```

The above component initially renders:

```html
<div>
  <h1>No Count</h1>
  <button>Increment</button>
</div>
```

When the Increment button is clicked once the content is updated:

```html
<div>
  <h1>1</h1>
  <button>Increment</button>
</div>
```

#### $.router

> `$.router(routesFn)`

Defines a set of nested routes within a component. Nested routes' paths are appended to the path of the parent component.

```js
const Example = makeComponent(($, self) => {
  return $(
    "div",

    $.router((self) => {
      self.route("main", ($, self) => {
        return $("h1", "This is the main route.");
      });

      self.route("secondary", ($, self) => {
        return $("h1", "This is the secondary route.");
      });

      // If no other routes match, redirect to the first in this router.
      self.redirect("*", "./main");

      // Redirect supports relative path syntax just like a file system:
      // - '/top-level'
      // - './current'
      // - '../parent'
      // - '../../super'
    })
  );
});

// Mount this component under a route that ends with a wildcard to allow nested routes.
app.route("parent/*", Example);
```

In the example above, `/parent/main` will display:

```html
<div>
  <h1>This is the main route.</h1>
</div>
```

and `/parent/secondary` will display:

```html
<div>
  <h1>This is the secondary route.</h1>
</div>
```

If the user visits `/parent` or any other path under `/parent`, the redirect will kick in and redirect to `/parent/main`.

## Testing

> TO DO

---

🦆
