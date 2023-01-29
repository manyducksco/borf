# Stores

The purpose of a Store is to hold state in one location where other components may access it. Stores combine the earlier Global and Local into one object that can be loaded globally or locally.

Stores are accessed with the `ctx.useStore()` function. This function can take a string key to load a built-in store, or a reference to a class that extends Store to get the closest instance of that class (locals first, falling back to global, then finally to error if not found).

Using the class itself as a key makes it possible to infer the store's export types, even when working in plain JavaScript. No need to create and pass around an AppGlobals type; just import and use what you need.

```tsx
import { Store, makeApp } from "woofe";
import { makeViewer } from "woofe/viewer";

class PushStore extends Store {
  setup(ctx) {
    const push = ctx.useStore(PushStore); // What happens with self reference? Probably just check and throw an error.

    return {
      async enablePushNotifications() {
        // Hit the API to register push notifications.
      },
    };
  }
}

class AuthStore extends Store {
  setup(ctx) {
    const http = ctx.useStore("http"); // Pass a string to get built-ins.
    const push = ctx.useStore(PushStore); // Pass the class to get an instance of a store you've defined.

    // TODO: Warn if you've accessed a local store when a global instance also exists (store shadowing).
    // This may lead to unexpected results if done by accident.

    return {
      async login(username, password) {
        const response = await http.post("/api/login", {
          body: { username, password },
        });

        // Enable push now that the user is logged in.
        await push.enablePushNotifications();
      },
    };
  }
}

const app = makeApp({
  // Order matters if global stores are accessing other global stores.
  // Stores must be loaded after the ones they're using.
  stores: [PushStore, AuthStore],
  routes: [
    { path: "/example", view: ExampleView },
    { path: "*", redirect: "/example" },
  ],
});

export default makeViewer(ExampleView, {
  // Has the same API as stores in an app:
  stores: [
    // If the value is just a store class, that store is instantiated and injected as normal.
    SomeOtherStore,

    // Use a config object for more advanced scenarios.
    // If `exports` is an object, that object will be returned whenever a PushStore is requested.
    {
      store: PushStore,
      exports: {
        enablePushNotifications() {
          console.log("push notifications enabled");
        },
      },
    },

    // If exports is another store class like a MockAuthStore,
    // that class will be instantiated and injected in place of AuthStore.
    { store: AuthStore, exports: MockAuthStore },

    // If exports is a function, that function will be called as a Store setup function
    // and the returned object will be exported in place of AuthStore.
    {
      store: AuthStore,
      exports: (ctx) => {
        async function login(username, password) {
          console.log(`logged in as ${username}`);
        }

        return { login };
      },
    },

    // This is equivalent to passing a store alone:
    { store: SomeOtherStore },

    // You can also pass attributes using the config object:
    { store: SomeOtherStore, attrs: { someValue: 5 } },
  ],

  // Wrap the viewer in a decorator to pass children and put it in a wrapper element.
  decorator: (Viewer, m) => {
    return (
      <div style={{ padding: 16, backgroundColor: "#ccc" }}>
        <Viewer>
          <span>Children</span>
        </Viewer>
      </div>
    );
  },

  presets: [
    {
      name: "Some Name",
      attrs: {
        exampleValue: "value",
      },

      // Can also override stores for each preset.
      stores: [{ store: PushStore, exports: {} }],

      // Can also decorate per preset.
      // TODO: Does this replace the top level decorator or nest within it?
      decorator: (Viewer, m) => {
        return (
          <div style={{ padding: 16, backgroundColor: "#ccc" }}>
            <Viewer>
              <span>Children</span>
            </Viewer>
          </div>
        );
      },
    },
    {
      name: "Other Name",
      attrs: {
        exampleValue: "other value",
      },
    },
  ],
});
```
