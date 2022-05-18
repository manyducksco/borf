# @woofjs/client

Front end routing, components and state for dogs. 🐕

`@woofjs/client` is a client-side JavaScript framework that shamelessly steals the best ideas from other frameworks; [React](https://reactjs.org/docs/introducing-jsx.html), [Angular](https://angular.io/guide/architecture-services), [Choo](https://github.com/choojs/choo#routing), and [Vue](https://vuejs.org/v2/guide/class-and-style.html) in particular.

## Hello World

```js
import { makeApp } from "@woofjs/client";

const app = makeApp();

app.route("*", ($) => {
  return $("h1", "Welcome to the app!");
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
app.route("users/:id", ($, self) => {
  const id = self.$route.get("params.id");

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

## Reactivity

> TODO

See [@woofjs/state](https://github.com/woofjs/state). Pass a state instead of a static value for any attribute and the DOM will update automatically as the state changes.

## Dolla

```js
app.route("users/:id", ($, self) => {
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

  // Access services defined at the app level.
  const service = self.getService("name");
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

app.route("/counter", ($) => {
  return (
    <div>
      <h1>World's Most Inconvenient Counter Demo</h1>
      <a href="/counter/view">See the number</a>
      <a href="/counter/controls">Change the number</a>
    </div>
  );
});

app.route("/counter/view", ($, self) => {
  const { $current } = self.getService("counter");

  return <h1>The Count is Now {$current}</h1>;
});

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

## Testing

> TO DO

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

#### `$.if($state[, thenFn][, elseFn])`

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

#### `$.each($state, component)`

Renders a component once for each item in an array. If the array is stored inside a $state the list will update whenever that $state is updated.

```js
const Example = makeComponent(($, self) => {
  const $list = makeState(["one", "two", "three"]);

  return $(
    "ul",

    // Render one <li> for each item in $list. Updates when $list changes.
    $.each($list, ($, self) => {
      // Components in an each have unique keys. In this case we're just using the position in the list.
      self.key = self.map("@index");

      // Return an <li> that contains the current value of this $list item.
      return $("li", self.map("@value"));
    })
  );
});
```

#### `$.watch($state, renderFn)`

> TODO

#### `$.text($state[, defaultText])`

> TODO

#### `$.router(fn)`

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
<h1>This is the main route.</h1>
```

and `/parent/secondary` will display:

```html
<h1>This is the secondary route.</h1>
```

If the user visits `/parent` or any other path under `/parent`, the redirect will kick in and redirect to `/parent/main`.

---

🦆
