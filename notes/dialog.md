# Dialog Global

Add a `dialog` global to handle dialogs (modals) by passing a view.

```js
class ExampleView extends View {
  setup(ctx) {
    const dialog = ctx.useStore("dialog");

    return (
      <button
        onclick={() => {
          const close = dialog.open(DialogView, {
            closeOnClickAway: true,
            inputs: {
              message: "This is a message from where the dialog was shown.",
            },
          });

          // Call function to close the dialog.
          close();
        }}
      >
        Show Dialog
      </button>
    );
  }
}

class DialogView extends View {
  static inputs = {
    open: {
      type: "boolean",
      about: "Dialog open/closed state.",
      required: true,
      writable: true,
    },
    message: {
      type: "string",
      default: "THIS IS THE DEFAULT MESSAGE",
    },
  };

  setup(ctx) {
    const $message = ctx.inputs.readable("message");

    return (
      <div class="dialog-panel">
        <p>This is a dialog. Click the close button to close it.</p>
        <p>Message: {$message}</p>
        <button
          onclick={() => {
            ctx.inputs.set("open", false);
          }}
        >
          Close
        </button>
      </div>
    );
  }
}
```
