Simplify components to functions.

```js
// A store returns an object.
function ExampleStore(ctx) {
  const $$value = new Writable(5);

  return {
    $value: $$value.toReadable(),
  };
}

// A view returns markup or null.
function ExampleView(ctx) {
  const { $value } = ctx.useStore(ExampleStore);

  return m("h1", "The value is:", $value);
}
```

TypeScript is more manual.

> In both cases, the ctx object is the same. The difference between a StoreContext and a ViewContext is the animateIn and animateOut hooks. An error will be thrown if a store uses them, therefore the StoreContext does not include them in the type even though they are present on the object.

> Or maybe I should just add beforeConnect and beforeDisconnect which do the same thing and are accessible on any component. The only difference between views and stores would then be the return value of the function.

```ts
function ExampleStore(ctx: StoreContext<Inputs>) {
  const $$value = new Writable(5);

  return {
    $value: $$value.toReadable(),
  };
}

function ExampleView(ctx: ViewContext<Inputs>) {
  const { $value } = ctx.useStore(ExampleStore);

  return m("h1", "The value is:", $value);
}
```

More opinionated content slots?

```js
app.setRootView(MainView);
app.setSplashView(SplashView); // Displayed while any async component promises are pending

// Opinionated layout?
// Ignore these to do your own layout, or save some time by slotting into a standard responsive app layout.
// This could be part of the UI package.

// Better yet, make this a ResponsiveAppLayout view that takes these as inputs.
app.setRootView(ResponsiveAppLayout, {
  header: HeaderView,
  footer: FooterView,
  navigation: [
    {
      icon: "/some/url.svg",
      name: "Home",
      pattern: "/", // Displayed as active when this pattern matches
      action: (navigate) => {
        navigate("/"); // Receives navigate function from router store
      },
    },
    {
      icon: "/other/url.svg",
      name: (t) => t("ui.dashboard"), // Translate callback; receives translate function from language store
      action: async (navigate) => {
        navigate("/dash");

        // Shows a loading indicator while promise is pending
      },
    },
  ],
});
```

Full typing for m() function, plus element helpers. JSX support would be nice, but if it can't work with functions that take a context instead of a props object, so be it. Keeping Borf simple is more important than looking like React.

```js
import { m } from "@borf/browser";
import { div, h1, p, span } from "@borf/browser/elements";

function ExampleView(ctx) {
  return div({ class: "layout" }, [
    h1("Title"),
    p({ class: "paragraph" }, [
      "This is text",
      span({ style: { fontWeight: "bold" } }, "but this part is bold"),
      m(OtherComponent, { value: "example" }),
    ]),
  ]);
}

// As opposed to:
function ExampleView(ctx) {
  return m("div", { class: "layout" }, [
    m("h1", "Title"),
    m("p", { class: "paragraph" }, [
      "This is text",
      m("span", { style: { fontWeight: "bold" } }, "but this part is bold"),
      m(OtherComponent, { value: "example" }),
    ]),
  ]);
}
```

Change animation lifecycle hooks `animateIn` and `animateOut` to be more generic.

```js
function ExampleView(ctx) {
  // spring values: 1 is out, 0 is in.
  const spring = new Spring({ initialValue: 1 });

  // Promises will resolve before other lifecycle hooks are called.
  // These can be used for in and out transitions in views.
  ctx.beforeConnected(async () => spring.animate(1, 0));
  ctx.beforeDisconnected(async () => spring.animate(0, 1));

  // Also rename lifecycle hooks to the past tense to clarify when they are called.
  ctx.onConnected(() => {
    ctx.log("View has been connected (after transition in)");
  });

  ctx.onDisconnected(() => {
    ctx.log("View has been disconnected (after transition out)");
  });

  return span(
    {
      style: {
        transform: spring.map((x) => `translateY(${x * 100}%)`),
        opacity: spring.map((x) => 1 - x),
      },
    },
    "hello"
  );
}
```

What about making outlet a helper?

```js
import { m, outlet } from "@borf/browser";

function ExampleView(self) {
  // Displays any children of this view inside a container. Children can be stored in the elementContext.
  // This would need to get the $$children of the nearest component.
  return m("div", { class: "container" }, outlet());
}
```

View helpers are now standalone functions. All library exports are shown below.

```js
import {
  App,
  Readable,
  Writable,
  Spring,
  Ref,
  m,
  when,
  unless,
  repeat,
  observe,
} from "@borf/browser";
```

Add new methods for setting component names and async loading content.

```js
async function AsyncView(ctx) {
  // Display this content while promise is pending. Put this before any async stuff.
  ctx.setLoader(m("span", "Loading..."));
  ctx.setLoader(LoadingView); // It can also be a view.

  // Set debug label name after the fact, or per instance. Defaults to the name of the function.
  ctx.setName("AwesomeView");

  return null;
}
```
