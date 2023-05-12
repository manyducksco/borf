# `borf`

The base package for Borf apps. Supplies CLI commands for interacting with your app.

## Commands

- `borf build` builds the app as static files and outputs it to a folder for deployment.
- `borf serve` serves the app in development mode, which rebuilds automatically when changes are made to the files and auto-reloads any browsers that are viewing it.
  - `borf serve --production` builds the app once with production optimizations and serves it without auto-reload. This can be used to deploy an app by cloning the repo, installing npm packages, and finally running this command.
  - Running `borf serve` while `NODE_ENV=production` is equivalent to using the `--production` flag.
- `borf viewer` collects any `*.viewer.[ext]` files and starts a server with a UI for viewing components.

## Dev Notes

The `serve` command needs to serve the API and the front-end from the same port on your local machine. This will involve some kind of proxy. Both the browser and server parts will need to be transpiled each time their files change, but the server managing this needs to stay active and hold requests that come in while the parts are indisposed, letting them through again once no builds are active.

Preferably, rebuilds would be paused until all requests are handled, at which point the rebuild would start and new requests would be held until the rebuild is finished. If a rebuild is queued, new requests would be held until the rebuild is finished.

Since requests could be coming from the front-end which is reloaded when changes occur, can we discard requests from a front-end that were sent before that front-end reloaded? Or just not handle requests if the client awaiting them has disconnected.
