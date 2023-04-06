# Borf

This is a monorepo for Borf, a full stack JS framework. It is managed using [lerna](https://lerna.js.org/).

## Framework Goals

- Be fully featured for modern web apps (components, routing, logging, error handling, state management, HTTP client)
- Be relatively lightweight on the front-end (<30kb gzipped)
- Answer the question "can we just chain a bunch of observables together to make an app?"

## Core Packages

- [`@borf/browser`](./packages/browser/README.md): Front-end framework which runs in the browser.
- [`@borf/server`](./packages/server/README.md): Back-end framework which runs on the server.

## Utility Packages

- [`@borf/build`](./packages/build/README.md): Build-system-in-a-box for Borf projects.
- [`@borf/inspect`](./packages/inspect/README.md): Visual testing and development environment for `@borf/browser` components.
- [`@borf/bedrock`](./packages/bedrock/README.md): A supplement to the JS standard library, with useful building block types for all JS code (not just Borf).

## Resources

- [Example Project](./examples/README.md)
