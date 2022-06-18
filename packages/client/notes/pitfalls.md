# Design pitfalls

- Watching states inside components with `$state.watch` will leave hanging watchers. You need to use `self.watchState($state, callback)` so the watchers can be cleaned up when the component disconnects. This is not an issue for services because they are only connected once.

- If a route (`/users/:id/edit`) changes from `/users/5/edit` to `/users/12/edit`, only the :id parameter will change. The route component will not be disconnected and reconnected. This may cause issues with state that applied to one user still being set when it switches to a new user. Consider reconnecting route components when their route is matched again.
