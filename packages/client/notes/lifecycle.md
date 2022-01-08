# Lifecycle

This page outlines the lifecycle for objects in woof.

## Components

Components have a few steps to be rendered:

To connect:

- Component function is called
- `beforeConnect` hook runs
- DOM node created and attached to parent
- `connected` hook runs

To disconnect:

- `beforeDisconnect` hook runs
- DOM node removed from its parent
- `disconnected` hook runs
- `watchState` watchers are cancelled
- DOM node released for garbage collection

## Services

Services have a similar lifecycle, but no disconnect because services live for the life of the app:

To connect:

- Service function is called
- `beforeConnect` hook runs
- App setup function is run, resolves promise
- Initial route is matched, components connected
- `connected` hook runs

## App

- `.connect(root)` function is called by your code
- Services are created, `beforeConnect` hooks run
- `setup` function runs, resolves
- Router starts listening for URL changes, initial route matched
- Service `connected` hooks run
- `.connect(root)` promise is resolved
