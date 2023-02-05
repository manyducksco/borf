# Potential design footguns

- Subscribing to observables directly (such as states) inside components will leave hanging subscriptions. You can use `ctx.observe()` instead so the subscriptions are cleaned up when the component disconnects.

- If a route (`/users/{#id}/edit`) changes from `/users/5/edit` to `/users/12/edit`, only the `id` parameter will change. The route view will not be disconnected and reconnected. This may cause issues with state that applied to one user still being set when it switches to a new user. Consider recreating route views when their route is matched again, or at least provide an option.

- It's possible to use `ctx.observe` inside a Repeat render function, which would result in a bunch of hanging subscriptions that don't get cleaned up if the Repeat value changes a lot while the observing component is still connected.
  - Possible solution for this is to restore Repeat to taking a View rather than a render function. The render function is nicer to read and write, but has this fairly significant problem.

To solve the Repeat observe issue, it could look like this:

```jsx
class RepeatItem extends View {
  static inputs = {
    item: {
      type: "object",
    },
    index: {
      type: "number",
    },
  };

  setup(ctx, m) {
    const $item = ctx.inputs.readable("item");
    const $index = ctx.inputs.readable("index");

    // Observe is cleaned up when this view is disconnected.
    ctx.observe($item, $index, (item, index) => {
      ctx.log(`Item is '${item}' at index #${index}`);
    });

    // Render whatever.
  }
}

// (observable, view[, keyFn])
m.repeat($items, RepeatItem, (item) => item.id);
```
