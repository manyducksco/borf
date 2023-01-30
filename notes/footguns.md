# Potential design footguns

- Subscribing to observables directly (such as states) inside components will leave hanging subscriptions. You can use `ctx.observe()` instead so the subscriptions are cleaned up when the component disconnects.

- If a route (`/users/:id/edit`) changes from `/users/5/edit` to `/users/12/edit`, only the :id parameter will change. The route view will not be disconnected and reconnected. This may cause issues with state that applied to one user still being set when it switches to a new user. Consider recreating route views when their route is matched again, or at least provide an option.

- It's possible to use `ctx.observe` inside a Repeat render function, which if the Repeat value changes a lot while the observing component is still connected, would result in a bunch of hanging subscriptions that don't get cleaned up as the Repeat re-renders.
  - Possible solution for this is to restore Repeat to taking a View rather than a render function. The render function is nicer to read and write, but has this fairly significant problem.
