# Misc. ideas that don't yet have a better place to be

### Builder Config

```js
import {Builder} from "@borf/build";

export default Builder.define({
  client: {
    entry: "./client/client.js",
    gzip: true,
  },
  server: {
    entry: "./server/server.js",
  },
});
```

### Render Methodology

```
HTML Elements \
   Components  --> Markup -> Connectable

Concepts in the user's realm are Views and Stores and HTML elements. Through the `m` function (or JSX), these objects are transmuted into Markup, an intermediary "template" that can produce instances of itself in actual DOM nodes. That instance is stored in a container called a Connectable, which can be `connect`ed to and `disconnect`ed from the DOM.

Woven throughout this web of DOM node factories and switches are the readables and writables that animate the switches.

An app is data hydraulics, where the state is hydraulic fluid getting pushed around by the user to make things happen. The developer chooses where it flows and how the force is applied, but the user applies the force to move the app.
```

### API rework

Why? You end up typing these function names a lot. Your code is easier to read and write if they are shorter because
there is less information to process. More attention goes toward deciphering the meaning of the code than goes toward
reading the labels the framework makes you use to access things.

```js
import {App, html} from "https://unpkg.com/@borf/browser";
import {ExampleStore} from "./stores/ExampleStore.js";

const app = new App();

// app.addStore -> app.store
app.store(ExampleStore);

// app.setRootView -> app.main
app.main(function Main(_, ctx) {
  // ctx.getStore -> ctx.use (?)
  const example = ctx.use(ExampleStore);
  const router = ctx.use("router");

  ctx.observe(router.$path, (path) => {
    ctx.log("router path is now:", path);
  });

  return html` <div>${ctx.outlet()}</div> `;
});

// app.addRoute -> app.route
app.route("/example", (attrs, ctx) => {
});

// app.addRedirect -> app.redirect
app.redirect("*", "/example");

// app.addLanguage -> app.language
app.language("en-US", {
  // URL to fetch with HTTP client
  translation: "/assets/lang/en.json",
});

// unchanged
app.setLanguage("en-US");

// NEW function to configure the app before it starts.
// Runs after stores are initialized, but before they are connected.
app.configure(async (ctx) => {
  const http = ctx.use("http");

  // Add middleware to HTTP client.
  http.middleware((req, next) => {
    // Set auth header for all same-origin outgoing requests.
    if (req.sameOrigin) {
      req.headers.set("authorization", "Bearer fffffffffffffffffffff");
    }

    return next();
  });

  // etc...
});

// unchanged
app.connect("#app");
```

### State Machines

```js
const machine = new Machine(({state, transition}) => {
  state("off", transition("toggle", "on"));
  state("on", transition("toggle", "off"));
});

machine.value; // "off"
machine.send("toggle");
machine.value; // "on"
machine.send("toggle");
machine.value; // "off"

ctx.observe(machine, (state) => {
  ctx.log("state changed", state);
});
```

### Standalone functions API

What if the API was structured as standalone functions rather than classes?

```jsx
import {
  App,
  writable,
  readable,
  computed,
  repeat,
  cond,
  isReadable,
  isWritable,
} from "@borf/browser";

// Readable and Writable are rewritten as functions
const $$count = writable(5);
const $factor = readable(2);

// Ref is a plain function
const someRef = ref();

// readable/writable take readables and writables as well (replaces Readable.from and Writable.from)
const $count = readable($$count);
const $factor2 = readable($factor); // returns the same instance of $factor
const $$factor2 = writable($factor); // throws an error; cannot convert readable to a writable

// Unwraps a possibly readable value (replaces Readable.unwrap)
const count = unwrap($$count);

// `computed` replaces .map() and Readable.merge()
const $multiplied = computed([$$count, $factor], (c, f) => c * f);

// Go back to .get() and .set() instead of .value getter/setter
$$count.get()
$$count.set(12)

// Remove immer from .update() to drop some weight
$$count.update((current) => current + 1);

// (but you can still import and use it)
$$complex.update(produce(state => {
  state.value1 = 2;
  state.value2 = 3;
}))

// Keep observe unchanged
const stop = $$count.observe(value => {
  // side effects
});

<div>
  // Current observe() helper replaced by a readable with a renderable in it
  {computed([$$something, $somethingElse], (value1, value2) => {
    return <h1>{value1} <span>{value2}</span></h1>
  })}

  {repeat($value, x => x.id, ($item, $index, c) => {
    return <li>{$item}</li>
  })}
</div>

// Go back to exporting m() function for markup out of the box
m("div", [
  computed([$$something, $somethingElse], (value1, value2) => {
    return m("h1", value1, m("span", value2));
  }),

  repeat($value, x => x.id, ($item, $index, c) => {
    return m("li", $item);
  }),

  cond($condition, m("div", "truthy"), m("div", "falsy")),
]);
```