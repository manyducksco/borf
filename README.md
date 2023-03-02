# Frameworke

This is a monorepo for Frameworke, a full stack JS framework. It is managed using [lerna](https://lerna.js.org/).

## Framework Goals

- Be relatively lightweight on the front-end (<30kb gzipped)
- Support common needs without relying on third party libraries (routing, state management, unit testing, logging)

## Core Packages

- [`@frameworke/fronte`](./packages/fronte/README.md): Front-end framework which runs in the browser. Create single page apps that run in the browser.
- [`@frameworke/backe`](./packages/backe/README.md): Back-end framework which runs on the server. Create APIs or server-rendered pages.

## Utility Packages

- [`@frameworke/builde`](./packages/builde/README.md): Build-system-in-a-box for Frameworke projects.
- [`@frameworke/inspecte`](./packages/inspecte/README.md): Visual testing and development environment for `@frameworke/fronte` components.
- [`@frameworke/bedrocke`](./packages/bedrocke/README.md): A supplement to the JS standard library, with useful building block types for all JS code (not just Frameworke).

## Resources

- [Example Project](./examples/README.md)

## Possible Size Optimizations

The total gzipped size of `@frameworke/fronte` is currently 26.5 kB. This could be reduced further by removing dependencies and narrowing some functionality.

These are the current third party dependencies and what they do:

- [`query-string`](https://bundlephobia.com/package/query-string@7.1.1) for comprehensive query string parsing support. Adds 2.3 kB to gzipped size.
  - Users can edit query params and user input is the wild west, so this is not that large for the utility it offers.
