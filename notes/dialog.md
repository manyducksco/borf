# Dialog Global

Add a `dialog` global to handle dialogs (modals) by passing a view.

```js
const ExampleView = View.define({
  setup(ctx) {
    const dialog = ctx.useStore("dialog");

    const infoDialog = dialog.create(DialogView, {
      closeOnClickAway: true,
    });

    return (
      <button
        onclick={() => {
          // Pass inputs when opening dialog.
          infoDialog.show({
            message: "This is a message from where the dialog was shown.",
          });

          // Close the dialog.
          infoDialog.hide();
        }}
      >
        Show Dialog
      </button>
    );
  },
});

const DialogView = View.define({
  inputs: {
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
  },

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
  },
});
```
