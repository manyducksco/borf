import woof, { makeView, makeGlobal, Bindable, Private } from "@woofjs/client";

type ExampleGlobalState = {};

const ExampleGlobal = makeGlobal<ExampleGlobalState, AppGlobals>((ctx) => {
  const router = ctx.global("router");

  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
});

type UsersGlobalState = {};

const UsersGlobal = makeGlobal<UsersGlobalState, AppGlobals>((ctx) => {
  return {
    async getUsers() {
      return [];
    },
  };
});

export type AppGlobals = {
  example: typeof ExampleGlobal;
  users: typeof UsersGlobal;
  fn: () => { isFunction: true };
};

const app = woof<AppGlobals>();

app.global("example", ExampleGlobal);
app.global("users", UsersGlobal);
app.global("fn", () => ({ isFunction: true }));

type ExampleState = {
  // name: string | ReadBinding<string> | ReadWriteBinding<string>; // Use types to specify if things can be bound or not.
  name: Bindable<string>; // Bindable is shorthand for the above.
  children: string;

  initialized: Private<boolean>; // Private state cannot be passed as attributes.
};

// The binding types above only take effect when passing attributes. All bindings are unwrapped to their base types internally.

const Example = makeView<ExampleState, AppGlobals>((ctx) => {
  ctx.name = "Example"; // debug tag will become `[view:Example]`

  // Define initial values for state unless overridden by attributes.
  ctx.defaultState = {
    name: "Bob",
    initialized: false,
  };

  const state = ctx.get(); // Snapshot of the whole state.
  const name = ctx.get("name"); // Snapshot of the value of 'name'

  const $name = ctx.readable("name"); // One-way binding to 'name'
  const $$name = ctx.writable("name"); // Two-way (settable) binding to 'name'

  // Update the value stored under 'name' in view state.
  ctx.set("name", "Bob");

  // Set the value from the binding, not the binding itself. Bindings cannot be stored in state.
  ctx.set("name", $name);

  // Observe the whole view state.
  ctx.observe((state) => {
    ctx.log("state changed to", state);
  });

  // Observe a specific key.
  ctx.observe("name", (name) => {
    ctx.log("name changed to", name);
  });

  // Observe a binding or other observable.
  ctx.observe($name, (name) => {
    ctx.log("$name changed to", name);
  });

  const { message } = ctx.global("example");

  // mergeStates creates a new state with an array of values from all passed states.
  // Reuse standard map method to transform it from there.
  const $multiplied = ctx.merge($name, message, (name, message) => {
    return `Hey ${name}, ${message}`;
  });

  // Can reference own state keys with strings or pass existing bindings.
  const $values = ctx.merge(
    "key1",
    "key2",
    $multiplied,
    (one, two, three) => one + two + three
  );

  // Possibility of simplifying debug methods.
  ctx.name = "Component name?";
  ctx.log("hello there");
  ctx.warn("warning!");
  ctx.error(new Error("error!"));

  // Same lifecycle methods
  ctx.beforeConnect(() => {
    ctx.set("initialized", true);
  });
  ctx.afterConnect(() => {});
  ctx.beforeDisconnect(() => {});
  ctx.afterDisconnect(() => {});

  return (
    <div>
      <header>
        <h1>New State Idea</h1>
      </header>

      {/* Creates an Outlet view that renders children or nested routes */}
      <p>{ctx.outlet()}</p>
    </div>
  );
});

type LayoutState = {
  userName: string;
};

// Attributes passed through JSX describe initial state or bindings to the component's state.
const Layout = makeView<LayoutState, AppGlobals>((ctx) => {
  ctx.defaultState = {
    userName: "Default",
  };

  // One-way bindings are named with a single $
  const $name = ctx.readable("userName");

  // Two-way bindings are named with two $$
  const $$name = ctx.writable("userName");

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

      <a>
        Text <em>Text</em> Text
      </a>
    </ul>
  );
});

app.route("/", Layout);
app.redirect("*", "/");

type ViewState = {
  title: string;
};

// Options object style
app.route<ViewState>("/some", {
  preload: async function (ctx) {
    // PreloadContext has
    // - .global()
    // - .get()
    // - .set()
    // - .show()

    ctx.show(<h1>Loading...</h1>);

    const http = ctx.global("http");
    const res = await http.get<ViewState>("/some/url");

    ctx.set({
      title: res.body.title,
      another: 8,
    });
  },
  view: function (ctx) {
    const $title = ctx.readable("title");

    return (
      <div>
        <h1>{$title}</h1>
        <section>{ctx.outlet()}</section>
      </div>
    );
  },
  subroutes: function (sub) {
    sub.route("/other", function (ctx) {
      return <div>OTHER</div>;
    });
  },
});
