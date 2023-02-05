# Error Handling Notes

It's become clear that just throwing errors wherever in the framework isn't going to work. All errors thrown should be clear about where they originate in the user's code. A stack trace of a bunch of woofe code isn't helpful to most people.

Ideas

- Add an `errors` store that collects all errors thrown inside the app.
- Disconnect the whole app when an error is thrown.
- Display a simple error page with message and stack trace info (defaults to on in development, off in production).

Authors can intercept errors and customize the error page through the `errors` store.

```jsx
const errors = ctx.useStore("errors");

// Intercept errors
const sub = errors.subscribe((err) => {
  SomeTypeOfAnalytics.sendError(err);
});
sub.unsubscribe();

errors.setErrorPage(ErrorPageView); // Set to null to not display one.
errors.showErrorsInProduction(); // Will enable if called by default, but can also take a boolean to set value directly.

class ErrorPageView extends View {
  // TODO: Warn in console in dev mode of any views that don't have an 'about' or 'inputs' defined.
  static about = "Custom error page for displaying custom errors.";

  static inputs = {
    error: {
      about: "An Error object as collected by @errors",
      required: true, // TODO: Make required the default with 'optional: true' for optional inputs.
    },
  };

  setup(ctx) {
    const $error = ctx.inputs.readable("error");

    return (
      <div>
        <h1>Something Happened</h1>
        <p>{$error.as((e) => e.message)}</p>

        <SomeStore>
          {(ctx) => {
            const state = ctx.useStore(SomeStore);

            return <span>Local value is: {state.value}</span>;
          }}
        </SomeStore>
      </div>
    );
  }
}
```
