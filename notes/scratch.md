# Misc. ideas that don't yet have a better place to be

### Builder Config

```js
import { Builder } from "@borf/build";

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

Why? You end up typing these function names a lot. Your code is easier to read and write if they are shorter because there is less information to process. More attention goes toward deciphering the meaning of the code than goes toward reading the labels the framework makes you use to access things.

```js
import { App, html } from "https://unpkg.com/@borf/browser";
import { ExampleStore } from "./stores/ExampleStore.js";

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
app.route("/example", (attrs, ctx) => {});

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
const machine = new Machine(({ state, transition }) => {
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
