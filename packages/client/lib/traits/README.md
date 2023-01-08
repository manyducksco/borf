# Traits

Traits are functions whose names start with the word `with`. They are called to create trait objects, which are then passed to a `make` function (like `makeView` or `makeLocal`) to give that object those traits.

## withName

Usable with:

- `makeGlobal`
- `makeLocal`
- `makeView`
- `makeTransitions`

```jsx
const Example = makeView(withName("ViewName"), function (ctx) {
  ctx.log("This is a message"); // Prints '[view:ViewName] This is a message'

  return <div>Sup</div>;
});
```

## withAttribute

Usable with:

- `makeLocal`
- `makeView`
- `makeTransitions`

```jsx
import { makeView, withAttribute, isString } from "@woofjs/client";

const Example = makeView(
  withAttribute("title", {
    validate: isString, // Validate type (only in dev mode by default)
    default: "The Default Title", // Provide a default value if not passed
    writable: false, // Allow .set, .update, and two way bindings
  }),
  function (ctx) {
    return (
      <header>
        <h1>{ctx.attributes.readable("title")}</h1>
      </header>
    );
  }
);
```

## withTransitions

Usable with:

- `makeView`

```jsx
const fadeInOut = makeTransitions(function (ctx) {
  const opacity = makeSpring(0, { stiffness: 100, damping: 300 });
  const y = makeSpring(-20, { stiffness: 200, damping: 200 });

  ctx.enter(() => Promise.all([opacity.to(1), y.to(0)]));
  ctx.exit(() => Promise.all([opacity.to(0), y.to(-20)]));

  return { opacity, y };
});

const ExampleView = makeView(withTransitions(fadeInOut), function (ctx) {
  const $opacity = ctx.attrs.readable("opacity");
  const $transform = ctx.attrs.readable("y").as((y) => `translateY(${y}px)`);

  return (
    <div
      styles={{
        opacity: $opacity,
        transform: $transform,
      }}
    >
      This is animated
    </div>
  );
});

// Alternative CSS mapper call signature.
const ExampleView = makeView(
  withTransitions(fadeInOut, function (values) {
    // This function maps fadeInOut's exports to CSS properties.
    // These properties will be applied to this view's `.node` automatically when this function is defined.
    return {
      opacity: values.opacity,
      transform: `translateY(${values.y}px)`,
    };
  }),
  function (ctx) {
    return <div>This is animated.</div>;
  }
);
```

# The Pattern

- `make` functions are constructors
- `with` functions are traits that modify a constructor
- `is` functions take a value and validate with a `true` or `false` result.
