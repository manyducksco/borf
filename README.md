# Borf

This is a monorepo for Borf, a full stack JS framework. It is managed using [lerna](https://lerna.js.org/).

## Framework Goals

- Be fully featured for modern web apps (components, routing, logging, error handling, state management, HTTP client)
- Be relatively lightweight on the front-end (<30kb gzipped)

## Core Packages

- [`@borf/browser`](./packages/browser/README.md): Front-end framework which runs in the browser.
- [`@borf/server`](./packages/server/README.md): Back-end framework which runs on the server.

## Utility Packages

- [`@borf/build`](./packages/build/README.md): Build-system-in-a-box for Borf projects.
- [`@borf/inspect`](./packages/inspect/README.md): Visual testing and development environment for `@borf/browser` components.
- [`@borf/bedrock`](./packages/bedrock/README.md): A supplement to the JS standard library, with useful building block types for all JS code (not just Borf).

## Resources

- [Example Project](./examples/README.md)

## Possible Size Optimizations

The total gzipped size of `@borf/browser` is currently 26.5 kB. This could be reduced further by removing dependencies and narrowing some functionality.

These are the current third party dependencies and what they do:

- [`query-string`](https://bundlephobia.com/package/query-string@7.1.1) for comprehensive query string parsing support. Adds 2.3 kB to gzipped size.
  - Users can edit query params and user input is the wild west, so this is not that large for the utility it offers.
