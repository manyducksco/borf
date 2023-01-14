## Composable view traits

Functions starting with `with` are passed to views to customize how they operate. `withName` supplies a name to identify the view in logs. `withAttribute` adds runtime attribute validation (plus self-documentation).

```jsx
import { makeView, withAttribute, withName } from "@woofjs/client";

// makeView takes args in any order.
// Plain function = render function
// makeAttribute() = attribute

const Example = makeView(
  // Replaces `ctx.name = "Example"`
  withName("Example"),

  // If no attributes are defined, allow any. If at least one, allow only defined attributes.
  // This makes validation opt-in so it's not a burden when prototyping, but when you care about
  // that sort of thing then it locks it down so you know what you will get.
  withAttribute("title", {
    type: "string", // Enforce type (optional)
    default: "The Title", // Makes attribute optional (otherwise error is thrown if not passed)
    writable: true, // Allows two way binding (error is thrown when setting if writable: false)
  }),
  withAttribute("description", {
    type: "string",
    default: "The description.",
  }),
  withAttribute("number", {
    // `type` is shorthand for preset parse functions.
    // You can pass your own `parse` instead of a `type`.
    parse: (value) => {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        throw Error("not a number");
      }
      return parsed;
    },
  }),

  (ctx) => {
    const attrs = ctx.attributes;

    return (
      <header>
        <h1>{attrs.readable("title")}</h1>
        <p>{attrs.readable("description")}</p>
      </header>
    );
  }
);
```

## Locals

Also while we're inventing new functions, I present locals. The same thing as globals, but you put them in the tree to provide an instance only to subviews. Woof's version of React contexts.

```jsx
// 1. Define a local.
const ExampleLocal = makeLocal((ctx) => {
  return {
    $$value: makeState(5),
  };
});

const ContainerView = makeView((ctx) => {
  return (
    // 2. Use it like a view to make available to all subviews.
    <ExampleLocal name="example">
      <SubView />
    </ExampleLocal>
  );
});

const SubView = makeView((ctx) => {
  // 3. Get a reference to the local. Throws an error if local isn't mounted upview.
  const example = ctx.local("example");

  return <h1>Value is {example.$$value}</h1>;
});
```

Should locals also work with attribute validation so you can pass arguments?

```jsx
const ExampleLocal = makeLocal({
  attributes: {
    initialValue: {
      type: "number",
      default: 0,
      description: "starting value (defaults to 0)",
    },
  },
  setup: (ctx) => {
    return {
      $$value: makeState(ctx.attributes.get("initialValue")),
    };
  },
});

// Now in a view:
<ExampleLocal as="example" initialValue={15}>
  <SubView />
</ExampleLocal>;
```

One consequence of this API is that because locals don't render any elements, you can't init another local inside a local. Is it a bad idea to allow access with `ctx.local("name")` inside locals? I don't have a valid use case for allowing it yet. They do need access to globals already to make `@http` calls, etc.
