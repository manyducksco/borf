# Design pitfalls

- Subscribing to observables (such as states) inside components will leave hanging subscriptions. You can use `ctx.observe()` so the subscriptions can be cleaned up when the component disconnects. This is not an issue for globals because they are only connected once.

- If a route (`/users/:id/edit`) changes from `/users/5/edit` to `/users/12/edit`, only the :id parameter will change. The route component will not be disconnected and reconnected. This may cause issues with state that applied to one user still being set when it switches to a new user. Consider reconnecting route components when their route is matched again, or at least provide an option.