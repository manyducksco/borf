# Potential design footguns

- Subscribing to observables directly (such as states) inside components will leave hanging subscriptions if not cleaned up manually. You can use the `ctx.observe` function instead so the subscriptions are cleaned up when the component disconnects.

- If a route (`/users/{#id}/edit`) changes from `/users/5/edit` to `/users/12/edit`, only the `id` parameter will change. The route view will not be setup again. This may cause issues with state that applied to one route still being set when it switches to a new user. Consider reinitializing views when their route is matched again, or at least provide an option to do so.
