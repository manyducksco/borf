import woof, {
  View,
  ReadBinding,
  ReadWriteBinding,
  Bindable,
  Private,
  GlobalContext,
} from "@woofjs/client";

type ExampleGlobalState = {};

const ExampleGlobal = function (
  this: GlobalContext<ExampleGlobalState, AppGlobals>
) {
  const router = this.global("router");

  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
};

type UsersGlobalState = {};

const UsersGlobal = function (
  this: GlobalContext<UsersGlobalState, AppGlobals>
) {
  return {
    async getUsers() {
      return [];
    },
  };
};

export type AppGlobals = {
  example: typeof ExampleGlobal;
  users: typeof UsersGlobal;
  fn: () => { isFunction: true };
};

const app = woof<AppGlobals>();

app.global("example", ExampleGlobal);
app.global("users", UsersGlobal);
app.global("fn", () => ({ isFunction: true }));

app.route("/", Layout);
app.redirect("*", "/");

type ExampleState = {
  // name: string | ReadBinding<string> | ReadWriteBinding<string>; // Use types to specify if things can be bound or not.
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

  const $name = this.read("name"); // One-way binding to 'name'
  const $$name = this.readWrite("name"); // Two-way (settable) binding to 'name'

  // Update the value stored under 'name' in view state.
  this.set("name", "Bob");

  // Set the value from the binding, not the binding itself. Bindings cannot be stored in state.
  this.set("name", $name);

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

  const { message } = this.global("example");

  // mergeStates creates a new state with an array of values from all passed states.
  // Reuse standard map method to transform it from there.
  const $multiplied = this.concat($name, message).to(([name, message]) => {
    return `Hey ${name}, ${message}`;
  });

  // Can reference own state keys with strings or pass existing bindings.
  const $values = this.concat("key1", "key2", $binding3);
  const $added = $values.to(([one, two, three]) => one + two + three);

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
        <h1>New State Idea</h1>
      </header>

      {/* Creates an Outlet view that renders children or nested routes */}
      <p>{this.outlet()}</p>
    </div>
  );
};

// Attributes passed through JSX describe initial state or bindings to the component's state.
const Layout: View<{ userName: string }, AppGlobals> = function () {
  this.defaultState = {
    userName: "Default",
  };

  // One-way bindings are named with a single $
  const $name = this.read("userName");

  // Two-way bindings are named with two $$
  const $$name = this.readWrite("userName");

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
          Children passed to a view will be rendered wherever `this.outlet()` is
          called.
        </Example>
      </li>
    </ul>
  );
};
