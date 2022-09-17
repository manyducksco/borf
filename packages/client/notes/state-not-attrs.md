# Idea

Components are renamed to 'views' and services to 'globals'. This breaks the association with React and Angular which could be a barrier to understanding for users unfamiliar with those frameworks.

Views and globals are said to have a _state_, which is an internal key-value store accessed by `get`, `set`, `map`, `bind` and `observe` methods. The `map` method gives you a one-way binding to values in state, while `bind` gives you a two-way binding. What used to be called states (`$value` and `$$value`) are now referred to as bindings.

```tsx
import { View, ReadBinding, ReadWriteBinding, Bindable, Private } from "@woofjs/client";

type ExampleState = {
  name: string | Readable<string> | Writable<string>; // Use types to specify if things can be bound or not.
  name: Bindable<string>; // Bindable is shorthand for the above.

  initialized: Private<boolean>; // Private state cannot be passed as attributes.

  // Children are defined in state
  children: string;
};

// Outlet renders elements stored in state.
// By default this is "children". The two calls below are equivalent.
this.outlet();
this.outlet("children");

// Renders an element stored at "someRef".
this.outlet("someRef");

<Parent tabs={[<span>one</span>, <span>two</span>, <span>three</span>]} />;

function Parent() {
  return (
    <div>
      // Render an array of elements
      {this.repeat("tabs", function () {
        return this.outlet("@"); // Repeat views receive @ and # (item and index)
      })}
      // Equivalent
      {this.outlet("tabs")}
    </div>
  );
}

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
        {this.outlet("variable", (value) => {
          return <span>{value()}</span>;
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

type LayoutState = {
  userName: string;
};

// Attributes passed through JSX describe initial state or bindings to the component's state.
const Layout: View<LayoutState, AppGlobals> = function () {
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

// Considering a class-based approach like this.
// Benefits:
//   - Cleaner looking type annotations in my opinion.
//   - Autocomplete works in plain JS.
//   - Can extract name from the class for debug prefix.
//   - May be lighter on memory since classes are defined once and instantiated many times.
//     - View function render and lifecycle logic has to be recreated again for each instance.
// Downsides:
//   - Actual rendering code is nested one level deeper.
class Layout extends View<LayoutState, AppGlobals> {
  static defaultState = {
    userName: "Default",
  };

  create() {
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
          <Example name={$$name}>
            Children passed to a view will be rendered wherever `this.outlet()` is called.
          </Example>
        </li>
      </ul>
    );
  }

  beforeConnect() {
    this.log("lifecycle: beforeConnect");
  }

  afterConnect() {
    this.log("lifecycle: afterConnect");
  }

  beforeDisconnect() {
    this.log("lifecycle: beforeDisconnect");
  }

  afterDisconnect() {
    this.log("lifecycle: afterDisconnect");
  }
}

class State<T> {
  get() {}
  set() {}
  observe() {}
  merge() {}
  readable() {}
  writable() {}
}

class View<S, G> extends State<S> {
  create() {}

  beforeConnect() {}
  afterConnect() {}
  beforeDisconnect() {}
  afterDisconnect() {}

  when() {}
  unless() {}
  repeat() {}
  outlet() {}
}

class Global<S, G> extends State<S> {
  create() {}

  beforeConnect() {}
  afterConnect() {}
}

// makeView and makeGlobal internally work the same way.
// The view doesn't have any logic internally to actually connect itself.
// This is done inside the framework, so private methods will never be accessible on the classes.

class Example extends View {
  static defaultState = {
    count: 0,
    items: ["one", "two", "three"],
  };

  create() {
    // Read-only bindings (one way binding).
    const $count = this.readable("count");

    // Read-write bindings (two way binding).
    const $$count = this.writable("count");

    return (
      <section>
        <header>
          <h1>The Count</h1>
        </header>

        <p>It is: {$count}</p>

        {/* Display only when the value is truthy. */}
        {this.when(
          $count.to((x) => x > 5), // Transform into a new state with `.to`
          <span>Count is greater than 5.</span>
        )}

        {/* Display only when the value is falsy. */}
        {this.unless(
          $count.to((x) => x > 0),
          <span>Count is 0.</span>
        )}

        {/* Render once for each item in an iterable. */}
        {this.repeat("items", ($value, $index) => {
          return (
            <li>
              ({$index}) {$value}
            </li>
          );
        })}

        {/* Render an element or value from state into the DOM. Defaults to "children" unless a different key is passed. */}
        {this.outlet()}
        {this.outlet("someKey")}
        {this.outlet("someKey", (value) => {
          return <span>{value}</span>;
        })}
      </section>
    );
  }

  /*=======================*\
  ||       Lifecycle       ||
  \*=======================*/

  beforeConnect() {
    this.log("lifecycle: beforeConnect");
  }

  afterConnect() {
    this.log("lifecycle: afterConnect");
  }

  beforeDisconnect() {
    this.log("lifecycle: beforeDisconnect");
  }

  afterDisconnect() {
    // Console logging methods
    this.log("lifecycle: afterDisconnect");
    this.warn("lifecycle: afterDisconnect");
    this.error(new Error("lifecycle: afterDisconnect"));
  }
}
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

class Counter extends Global {
  static defaultState = {
    count: 0,
  };

  create() {
    return {
      $count: this.readable("count"),
      increment: () => {
        this.set("count", (x) => x + 1);
      },
      decrement: () => {
        this.set("count", (x) => x - 1);
      },
      reset: () => {
        this.set("count", 0);
      },
    };
  }
}
app.global("counter", Counter);

// Okay, I think my final verdict is the bound function is less cognitively demanding.
// I'm feeling like navigating the structure of the class is getting in the way of thinking through the logic.
// This could be because I'm more familiar with writing functions instead of classes.
app.global("counter", function () {
  this.defaultState = {
    count: 0,
  };

  const increment = () => {
    this.set("count", (x) => x + 1);
  };

  const decrement = () => {
    this.set("count", (x) => x - 1);
  };

  const reset = () => {
    this.set("count", 0);
  };

  return {
    $count: this.readable("count"),
    increment,
    decrement,
    reset,
  };
});

class App extends View {
  create() {
    const { $count, increment, decrement, reset } = this.global("counter");

    return (
      <div>
        <div class="count">
          <h1>{$count}</h1>
        </div>
        <div class="buttons">
          <button onclick={increment}>+1</button>
          <button onclick={decrement}>-1</button>
          <button onclick={reset}>Reset</button>
        </div>
      </div>
    );
  }
}

class Counter extends View {
  static defaultState = {
    count: 0,
  };

  create() {
    const $count = this.readable("count");

    return (
      <div>
        <div class="count">
          <h1>{$count}</h1>
        </div>
        <div class="buttons">
          <button onclick={() => this.increment()}>+1</button>
          <button onclick={() => this.decrement()}>-1</button>
          <button onclick={() => this.reset()}>Reset</button>
        </div>
      </div>
    );
  }

  increment() {
    this.set("count", (x) => x + 1);
  }

  decrement() {
    this.set("count", (x) => x - 1);
  }

  reset() {
    this.set("count", 0);
  }
}

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
