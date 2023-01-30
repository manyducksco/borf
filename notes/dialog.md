# Dialog Global

Add a `dialog` global to handle dialogs (modals) by passing a view.

```js
class ExampleView extends View {
  setup(ctx) {
    const dialog = ctx.useStore("dialog");

    return (
      <button
        onclick={() => {
          const example = dialog.open(DialogView, {
            closeOnClickAway: true,
            attrs: {
              message: "This is a message from where the dialog was shown.",
            },
          });

          example.close();
        }}
      >
        Show Dialog
      </button>
    );
  }
}

class DialogView extends View {
  setup(ctx) {
    const $message = ctx.attrs.readable("message");

    return (
      <div class="dialog-panel">
        <p>This is a dialog. Click the close button to close it.</p>
        <p>Message: {$message}</p>
        <button
          onclick={() => {
            ctx.attrs.set("open", false);
          }}
        >
          Close
        </button>
      </div>
    );
  }
}
```
