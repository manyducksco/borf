# Idea

Components are renamed to 'views' and services to 'globals'. This breaks the association with React and Angular which could be a barrier to understanding for users unfamiliar with those frameworks.

Views and globals are said to have a _state_, which is an internal key-value store accessed by `get`, `set`, `map`, `bind` and `observe` methods. The `map` method gives you a one-way binding to values in state, while `bind` gives you a two-way binding. What used to be called states (`$value` and `$$value`) are now referred to as bindings.

```tsx
import { View, ReadBinding, ReadWriteBinding, Bindable, Private } from "@woofjs/client";

type ExampleState = {
  name: string | ReadBinding<string> | ReadWriteBinding<string>; // Use types to specify if things can be bound or not.
  name: Bindable<string>; // Bindable is shorthand for the above.

  initialized: Private<boolean>; // Private state cannot be passed as attributes.
};

// The binding types above only take effect when passing attributes. All bindings are unwrapped to their base types internally.

const Example: View<ExampleState, AppGlobals> = function () {
  this.name = "Example"; // debug tag will become `[view:Example]`

  // Define initial values for state unless overridden by attributes.
  this.defaultState = {
    name: "Bob",
    initialized: false,
  };

  const state = this.get(); // Snapshot of the whole state.
  const name = this.get("name"); // Snapshot of the value of 'name'

  this.set("name", "Bob"); // Update the value stored under 'name' in view state.
  this.set("name", $name); // Set the value from the binding, not the binding itself. Bindings cannot be stored in state.

  const $name = this.readable("name"); // Read-only binding to 'name' (formerly map)
  const $$name = this.writable("name"); // Read-write binding to 'name' (formerly bind)

  // The genius part of this naming scheme is that 'read' is a lot shorter to type,
  // leading the lazy to reach for read-only bindings which are usually the best choice.

  // Observe the whole view state.
  this.observe((state) => {
    this.log("state changed to", state);
  });

  // Observe a specific key.
  this.observe("name", (name) => {
    this.log("name changed to", name);
  });

  // Observe a binding or other observable.
  this.observe($name, (name) => {
    this.log("$name changed to", name);
  });

  const { $multiplier } = this.global("data");

  // Combine multiple state variables into one bound value.
  // Strings represent the value of that key in local state.
  // Bindings represent their own values.
  const $multiplied = this.merge("number", $multiplier, (num, mult) => {
    return num * mult;
  });

  // Derive a new state binding from the whole state.
  const $value = this.readable().to((state) => {
    return state.value1 + state.value2;
  });

  // Possibility of simplifying debug methods.
  this.name = "Component name?";
  this.log("hello there");
  this.warn("warning!");
  this.error(new Error("error!"));

  // Same lifecycle methods
  this.beforeConnect(() => {
    this.set("initialized", true);
  });
  this.afterConnect(() => {});
  this.beforeDisconnect(() => {});
  this.afterDisconnect(() => {});

  return (
    <div>
      <header>
        <h1>Hello {this.readable("name").to((n) => n.toUpperCase())}</h1>
      </header>

      <section>
        {this.when("variable", <p>variable is truthy</p>)}
        {this.unless("variable", <p>variable is falsy</p>)}
        {/*
          type check the state value's type based on the key passed here show as
          error if `shoppingList` is not iterable
        */}
        {this.repeat("shoppingList", function ListItem($item, $index) {
          // bindings to the item and index are passed as arguments when components are rendered inside `repeat`.
          const onclick = () => {
            alert($item.get());
          };

          return <li onclick={onclick}>{$item}</li>;
        })}
        {this.watch("variable", (value) => {
          return <span>{value}</span>;
        })}
      </section>

      {/* Creates an Outlet view that renders children or nested routes */}
      <p>{this.outlet()}</p>
    </div>
  );

  // This makes h() look kind of cool:
  return h("div", [
    h("article", [
      h("ul", [
        this.repeat("items", function ($item, $index) {
          return h(
            "li",
            $item.to((item) => item.name)
          );
        }),
      ]),
    ]),
    h("article", { class: "some-article" }, [
      // This comment is necessary to force this to stay on the next line.
      this.when("value", h("p", "Text")),
    ]),
    h("p", "This is some text here."),
  ]);
};

// Attributes passed through JSX describe initial state or bindings to the component's state.
const Layout: View<{ userName: string }, AppGlobals> = function () {
  this.defaultState = {
    userName: "Default",
  };

  // Read bindings are named with a single $
  const $name = this.readable("userName");

  // Read-write bindings are named with two $$
  const $$name = this.writable("userName");

  return (
    <ul>
      <li>
        {/* The 'name' state key receives an initial value of "John". */}
        <Example name="John" />
      </li>
      <li>
        {/* Value can change from here but <Example> can only read it. Setting 'name' internally will have no effect. */}
        <Example name={$name} />
      </li>
      <li>
        {/* Setting 'name' inside <Example> will update the value of $$name. */}
        <Example name={$$name} />
      </li>
      <li>
        <Example name={$$name}>Children passed to a view will be rendered wherever `this.outlet()` is called.</Example>
      </li>
    </ul>
  );
};
```

So the view has a key-value store where it stores all its data. Initial values for that store are passed as attributes.

State is localized to either a view or a global, making it easier to decide where it should go based on where the state is needed.

Total state of a view can be tracked. This potentially makes debugging easier.

States as an independent concept (makeState) never show up. State always originates at a view or global. There is no way to track any kind of dynamic state outside one of these containers.

```tsx
import { woof } from "@woofjs/client";

const app = woof();

type CounterState = {
  count: number;
};

app.global("counter", function (this: GlobalContext<CounterState>) {
  this.defaultState = {
    count: 0,
  };

  // The methods below are actually destructurable without losing their reference to `this`
  // Because they have to be arrow functions to access `this`, it should always be pointed to this context.
  return {
    $count: this.map("count"),
    increment: () => this.set("count", (count) => count + 1),
    decrement: () => this.set("count", (count) => count - 1),
  };
});

app.route("*", function () {
  const { $count, increment, decrement } = this.global("counter");
  const { $$query } = this.global("router");

  // Update query param 'count' whenever the binding changes.
  this.observe($count, (value) => {
    $$query.set((q) => {
      q.count = value;
    });
  });

  return (
    <div>
      <h1>Count: {$count}</h1>
      <div>
        <button onclick={decrement}>-1</button>
        <button onclick={increment}>+1</button>
      </div>
      <ul>
        {repeat(this.map("list"), function Item() {
          const $value = this.map("value");
          const $index = this.map("index");
        })}
      </ul>
    </div>
  );
});

app.route("*", {
  // Resolves to an object that is given to the view as initial state.
  // These values will be present when the view function first runs.
  async preload() {
    const http = this.global("http");

    // Show a temporary component or element until preload resolves.
    this.show(<p>Loading...</p>);

    const res = await http.get("/motd");

    if (res.ok) {
      return { message: res.body };
    }
  },

  view() {
    return <div>{this.map("message")}</div>;
  },
});
```
