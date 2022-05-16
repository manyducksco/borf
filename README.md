# Woof JS

This is a monorepo for the Woof JS framework. It is managed using [lerna](https://lerna.js.org/).

## Framework Goals

- Be possible for an average programmer to read and understand
- Support common use cases without relying on third party libraries (routing, state management, unit testing)

## Core Packages

- [`@woofjs/client`](./packages/client/README.md): Create single page apps that run in the browser
- [`@woofjs/server`](./packages/server/README.md): Create APIs or apps with server-rendered pages
- [`@woofjs/cli`](./packages/cli/README.md): Build-system-in-a-box for the command line

## Utility Packages

- [`@woofjs/router`](./packages/router/README.md): Route matching logic in a reusable library
- [`@woofjs/state`](./packages/state/README.md): Observable state containers in a reusable library

## Resources

- [Example Project](./packages/examples/README.md)
