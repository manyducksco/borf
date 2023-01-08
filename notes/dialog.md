# Dialog Global

Add a `dialog` global to handle dialogs (modals) by passing a view.

```js
function ExampleView(ctx) {
  const { makeDialog } = ctx.global("@dialog");

  return (
    <button
      onclick={() => {
        //  make(view, config) => Dialog
        const example = makeDialog(DialogView, {
          closeOnClickAway: true,
        });

        // show(attributes)
        example.open({
          message: "This is a message from where the dialog was shown.",
        });

        // dismiss dialog
        example.close();
      }}
    >
      Show Dialog
    </button>
  );
}

function DialogView(ctx) {
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
```
