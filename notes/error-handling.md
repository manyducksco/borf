# Error Handling Notes

It's become clear that just throwing errors wherever in the framework isn't going to work. All errors thrown should be clear about where they originate in the user's code. A stack trace of a bunch of woofe code isn't helpful to most people.

Ideas

- Add an @errors global that collects all errors thrown inside the framework.
- Unmount the app when an error is thrown.
- Display a simple error page in development with message and stack trace info.

Authors can intercept errors and customize the error page through the @errors global.

```jsx
const errors = ctx.global("@errors");

// Intercept errors
const sub = errors.subscribe((err) => {
  SomeTypeOfAnalytics.sendError(err);
});
sub.unsubscribe();

errors.setErrorPage(ErrorPageView);
errors.showErrorsInProduction(); // Will enable if called by default, but can also take a boolean to set value directly.
```

Other random ideas:

```jsx
// An element created with m() or JSX
class Markup extends Connectable {
  constructor() {}

  setup(ctx) {}
}

// TODO: One upside of classes is they have a name, so you don't need to supply one. Switch to this?
class ErrorPageView extends View {
  // NOTE: If static, 'about' and 'attrs' will need to be passed to the view constructor by the calling code.
  // A little weird but it still seems nicer than duplicating them for every instance.
  // I also like that they can't be accessed from inside setup if they're static.

  // TODO: Warn in console in dev mode of any views that don't have an 'about' or 'attributes' defined.
  static about = "Custom error page for displaying custom errors.";

  // TODO: Shorten attribute definitions to just 'attrs' since that's what it's still called on the context.
  static attrs = {
    error: {
      about: "An Error object as collected by @errors",
      required: true, // TODO: Make required the default with 'optional: true' for optional attributes.
    },
  };

  setup(ctx) {
    const $error = ctx.attrs.readable("error");

    return (
      <div>
        <h1>Something Happened</h1>
        <p>{$error.as((e) => e.message)}</p>

        <SomeLocal name="state">
          {(ctx) => {
            const state = ctx.local("state");

            return <span>Local value is: {state.value}</span>;
          }}
        </SomeLocal>
      </div>
    );
  }
}

// When used in a view like <ErrorPageView>, passed to m(ErrorPageView, attributes, ...children)
// That function determines that it's a view class and handles accordingly.
const view = new ErrorPageView({
  appContext,
  elementContext,
  attributes,
  children,
});
view.connect(parentNode);

class SomeLocal extends Local {
  static about = "Example of a local with class syntax.";
  static attributes = {
    initialValue: {
      type: "number",
      default: 1,
    },
  };

  setup(ctx) {
    return {
      value: ctx.attrs.get("initialValue"),
    };
  }
}

class SomeGlobal extends Global {
  static about = "Example of a global with class syntax.";

  setup(ctx) {
    const $$value = makeState(5);

    return {
      $value: $$value.readable(),
    };
  }
}

const Quack = makeApp({
  // Is there any way to extract a type from a globals array?
  // Like
  // {
  //   some: typeof SomeGlobal,
  //   other: typeof OtherGlobal,
  //   whuh: typeof Whuh
  // }
  globals: [
    { name: "some", global: SomeGlobal },
    { name: "other", global: OtherGlobal },
    { name: "whuh", global: WhuhGlobal },
  ],
  view: (ctx) => {
    const some = ctx.global("some");
    return <div>Value is: {some.$value}</div>;
  },
});

// Get global types to pass to components.
type QuackGlobals = GlobalsOf<typeof Quack>;

Quack.connect("#app");
```
