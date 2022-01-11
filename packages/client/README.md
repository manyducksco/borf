# @woofjs/app

Woof front end components.

## Goals

- Be easy to understand
- The obvious way to accomplish something should be the correct way (a.k.a. "pit of success")
- Don't require a build system -- import from CDN should be a valid way to build an app
- Run the minimal amount of logic to get the job done (including DOM updates)

## Main doc sections and order

- hello world example
- state
- routing
- dolla
- components
- services
- testing

## TO DO

### Create dev tools

Add a dev tool service that collects info on service access. Eventually build a map to see which components and services are bringing in a given service.

## Design pitfalls

- Watching states inside components with `$state.watch` will leave hanging watchers. You need to use `self.watchState($state, callback)` so the watchers can be cleaned up when the component disconnects. This is not an issue for services because they are only connected once.
- It's possible to use a component's `$` to create outlets in a nested route. This will cause route matching to act weird. Is there a way to prevent this?
