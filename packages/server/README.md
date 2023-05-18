# ☁️ Borf: Server

> CAUTION: This package is extremely early in development. Breaking changes are expected and not all documented features are implemented yet.

JSON API companion server.

Support your client-side app with an API or create a dynamic server-rendered app.

## Basics and Routing

```js
import { App } from "@borf/server";
import { ExampleStore } from "./globals/ExampleStore";

const app = new App();

app.store(ExampleStore);

const corsDefaults = {
  allowOrigin: ["*"],
  allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowCredentials: false,
};

const corsOptions = {
  ...corsDefaults,
  allowCredentials: true, // Determines if Access-Control-Allow-Credentials is set
  allowHeaders: [], // Access-Control-Allow-Headers. If not passed, defaults to the value of Access-Control-Request-Headers on the request
  exposeHeaders: [], // Access-Control-Expose-Headers
  maxAge: 99999999999999999, // (in seconds) Access-Control-Max-Age
};

app.cors(); // Allow all methods on all origins.
app.cors(corsOptions); // Use specified options.

app.fallback(); // Fallback to index.html for capable requests to support client side routing.
app.fallback("/some/weird/index.html"); // Specify your own index.html fallback path.

app.static(); // Add default static directory (client bundle output)
app.static("/static/path", "/path/to/actual/dir"); // Add custom static directory

// Create API routes with functions named after HTTP methods (`get`, `post`, `delete`, etc.)
app.get("/some-route", function (ctx) {
  const example = ctx.use(ExampleStore);

  ctx.res.headers.set("name", "value");
  ctx.res.status = 200;

  // An object returned from a route becomes a JSON body automatically.
  return {
    message: "This is a JSON response.",
  };
});

// Listen for HTTP requests on localhost at specified port number.
app.start(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
```

## Middleware

> TODO: This section is no longer accurate.

```js
// Mount middleware to run for every request.
app.middleware(async (ctx, next) => {
  const timer = ctx.use(TimingStore).createTimer(ctx.req.path);

  timer.start();
  await next();
  timer.stop();

  timer.save();

  // ctx object has:
  ctx = {
    // place for middleware to store anything the app creator wants, such as auth information
    cache: {},
    // middleware can mutate this object as it gets passed through
    request: {
      verb: "post",
      protocol: "http",
      domain: "localhost",
      port: 3000,
      uri: "/some/path",
      headers: {
        authorization: "Bearer 12345",
      },
      body: {
        // JSON and form data are auto parsed
        data: {
          number: 12,
        },
      },
    },
    response: {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
      body: {
        // An object body is serialized according to the content-type header. A string body is considered already serialized and passed through as-is.
        data: {
          response: "nuh",
        },
      },
    },
    use(store) {},
    redirect(to) {},
  };

  // Once all handlers have run the response is created from the state of the context object.
  // If an error is thrown the server responds with 500 and a serialized error object. Server can be configured with options to exclude the stack trace or use a custom message for production builds.
});

// Express-style verb methods to handle routes. Pictured with multiple middleware functions.
app.get(
  "/some/url",
  (ctx, next) => {
    const auth = ctx.use(AuthStore);
    // Admin check. Presume `auth` is added by an auth middleware that runs before this.
    if (!auth.isAdmin) {
      return ctx.redirect("/other/path");
    }

    return next();
  },
  (ctx, next) => {
    // Analytics.
    ctx.use(AnalyticsStore).pageView(request.location.pathname);

    return next();
  },
  (ctx, next) => {
    // Response time recorder.
    const timer = ctx.use(TimingStore).createTimer(request.location.pathname);

    timer.start();
    await next();
    timer.stop();

    timer.save();
  },
  (ctx) => {
    ctx.response.status = 200;

    return {
      message: "response"
    };
  }
);
```

## Router

If you have many routes and you want to separate them into different files, use a Router. This has the same routing and component mounting options as the server.

```js
import { Router } from "@borf/server";

const router = new Router();

router.get("/", () => {
  return "OK"; // Return a body
});

router.get("manual/json", (ctx) => {
  ctx.res.headers.set("content-type", "application/json");

  return JSON.stringify({
    message: "This is returned as string, but content-type is set to application/json",
  });
});

router.get("auto/json", () => {
  return {
    message: "This is returned as an object, so content-type is inferred as application/json",
  };
});

export default router;
```

Then import this into the main server file and `.mount` it.

```js
import routes from "./router.js";

app.router(routes);
app.router("/sub", routes); // To mount routes under a sub path.
```

## Server Rendered Pages

Instead of JSON, you can return elements to render using `h()` or JSX. This returns an HTML response.

```js

```

---

🦆
