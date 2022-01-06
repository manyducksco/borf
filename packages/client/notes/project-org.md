# Project Organization

Namespace `@woof.js` on NPM (or `@woofjs` if the dot would cause folder naming issues).

Packages:

- @woofjs/cli
- @woofjs/app + @woofjs/app/testing
  - App/makeApp, Component, Service
  - suite, wrapComponent, wrapService
- @woofjs/server + @woofjs/server/testing
  - Server/makeServer, Resource, Service
  - suite, wrapResource, wrapService
- @woofjs/data
  - makeStore, Model, Adapter
- @woofjs/state (state package standalone - used in other packages)
  - makeState, combineStates, isState
- @woofjs/router (router package standalone - used in other packages)
  - makeRouter, joinPath, etc.
- @woofjs/testing (generic implementation - used in app and server packages)
  - makeTestWrapper
