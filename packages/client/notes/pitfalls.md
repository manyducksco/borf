# Design pitfalls

- Watching states inside components with `$state.watch` will leave hanging watchers. You need to use `self.watchState($state, callback)` so the watchers can be cleaned up when the component disconnects. This is not an issue for services because they are only connected once.

- It's possible to use a component's `$` to create outlets in a nested route. This will cause route matching to act weird. Is there a way to prevent this?
