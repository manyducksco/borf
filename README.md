# Woof JS

This is a monorepo for the Woof JS framework. It is managed using [lerna](https://lerna.js.org/).

## Framework Goals

- Be possible for an average programmer to read and understand
- Support common needs without relying on third party libraries (routing, state management, unit testing, logging)

## Core Packages

- [`@woofjs/client`](./packages/client/README.md): Create single page apps that run in the browser
- [`@woofjs/server`](./packages/server/README.md): Create APIs or apps with server-rendered pages
- [`@woofjs/cli`](./packages/cli/README.md): Build-system-in-a-box for the command line

## Utility Packages

- [`@woofjs/router`](./packages/router/README.md): Route matching logic in a reusable library
- [`@woofjs/state`](./packages/state/README.md): Observable state containers in a reusable library

## Resources

- [Example Project](./packages/examples/README.md)

## Possible Size Optimizations

The total gzipped size of `@woofjs/client` is currently 27.7 kB. This could be reduced further by removing dependencies and narrowing some functionality.

The following dependencies are used to support convenient features:

- [`color-hash`](https://bundlephobia.com/package/color-hash@2.0.1) in `@woofjs/client` for deterministic debug channel name colors in the console. Adds 3.9 kB to gzipped size.
- [`query-string`](https://bundlephobia.com/package/query-string@7.1.1) in `@woofjs/router` for comprehensive query string parsing support. Adds 2.3 kB to gzipped size.
- [`immer`](https://bundlephobia.com/package/immer@9.0.14) in `@woofjs/state` for mutation-style updates in .set(). Adds 5.6 kB to gzipped size.
