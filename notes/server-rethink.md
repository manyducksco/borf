# Goals

1. Easily create route handlers that serve JSON API responses or HTML pages.
2. Serve a client app automatically (or with minimal config) in dev mode using vite.
3. Build and serve a client app in production mode.
4. Generate OpenAPI spec from router metadata?

## Thoughts

What if the server is the build system? If the project structure sticks to conventions, borf can take care of everything for dev and production builds depending on NODE_ENV.

```js
import { Server, useRequest, useStore, useContext } from "@borf/server";

const app = new Server();

app.addStaticPath("/files", "/actual/folder/on/disk/where/files/are");

// Configure app here.

async function Auth({ req, res, next }) {
  const auth = useStore(AuthStore);

  const header = req.headers.get("authorization");
  const token = header?.replace(/^bearer\s/i, "");

  if (!token) {
    res.status = 401;
    return {
      message: "Bearer token not found in authorization header",
    };
  }

  const user = await auth.getUserByToken(token);

  if (!user) {
    res.status = 403;
    return {
      message: "Bearer token invalid",
    };
  }

  // If these pass then nothing is returned and next() is not called. Request handling continues through the list of handlers.
  // If a response body was returned then this is the end of the road. No further handlers run and the response is sent (or continues back through the next() await chain until it is eventually sent).
}

app.onGet("/path", Auth, async function GetPath(ctx) {
  // Same name/route labeling as browser-side
  const console = useConsole();

  // Context has information about the request, options for the pending response, and a next function to await further handlers.
  const { req, res, next } = ctx;

  // Request object:
  req.params;
  req.query;
  req.uri;
  req.body;
  req.domain;
  req.protocol;
  // ...

  // Work with response headers
  res.headers.set("value", "something");

  // Work with response status
  res.status = 403;

  // Await the remaining handlers
  const res = await next();

  // If a value is returned now, it overwrites the previous response body.
  // -> This means you could have a middleware rewrite a JSON response into an HTML page.
  // If undefined is returned, the existing response body remains.
  // If next() is not called, it is automatically called after this handler resolves.
});

app.listen(4000);
```

Project structure:

```
project/
  app/
    browser.html (browser entrypoint for vite)
    server.js (server entrypoint)
    # code can be shared between browser and server (types, helpers, etc.)
  static/
    # files that will be copied as-is (maybe optimized and gzipped)
  package.json
  borf.json (optional config to change paths and options)
```

Package would include CLI commands:

- `borf serve` to run in dev mode with live reload
- `borf serve --production` to build and run in production mode with all optimizations (clone your project's git repo, npm install, and run this for an easy production deploy)
- `borf build [--production]` to build app output and place it in the `build/` folder (`start` uses a temp folder outside the project; use this if you prefer to build the app files for deployment)
- `borf viewer` to start the browser component inspector (reads `.viewer.js` files throughout the app)
  - Could this include generated API documentation and route testing UI? Use metadata from routers to build a route that serves this configuration.

## Stores

I'm thinking stores on the server should be app-level only. Do we need per-request store instances? Auth for example? That kind of thing is probably better done in middleware. Stores would work better for things like a database connection or managing server-wide resources like socket connections.
