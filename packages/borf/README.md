# `borf`

The base package for Borf apps. Supplies CLI commands for interacting with your app.

## Commands

- `borf build` builds the app as static files and outputs it to a folder for deployment.
- `borf serve` serves the app in development mode, which rebuilds automatically when changes are made to the files and auto-reloads any browsers that are viewing it.
- `borf viewer` collects any `*.viewer.[ext]` files and starts a server with a UI for viewing components and running unit tests against them.
