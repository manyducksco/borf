# ☁️ Borf: Server

> CAUTION: This package is extremely early in development. Breaking changes are expected and not all documented features are implemented yet.

JSON API companion server.

Support your client-side app with an API or create a dynamic server-rendered app.

## Basics and Routing

```js
import { App } from "@borf/server";
import { ExampleStore } from "./globals/ExampleStore";

const app = new App();

app.addStore(ExampleStore);

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

app.addCORS(); // Allow all methods on all origins.
app.addCORS(corsOptions); // Use specified options.

app.addFallback(); // Fallback to index.html for capable requests to support client side routing.
app.addFallback("/some/weird/index.html"); // Specify your own index.html fallback path.

app.addStaticFiles(); // Add default static directory (client bundle output)
app.addStaticFiles("/static/path", "/path/to/actual/dir"); // Add custom static directory

// Create API routes with functions named after HTTP methods (`get`, `post`, `delete`, etc.)
app.onGet("/some-route", function (ctx) {
  const example = ctx.useStore(ExampleStore);

  ctx.response.headers.set("name", "value");
  ctx.response.statusCode = 200;

  // An object returned from a route becomes a JSON body automatically.
  return {
    message: "This is a JSON response.",
  };
});

// Server-sent events. The connection stays open until the source is closed.
// This connection is initiated client-side with EventSource.
// see: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
app.onGet("/events", (ctx) => {
  return new EventSource((src) => {
    // Send a message with content 'whatever'.
    src.send("whatever");

    // Send a 'ping' event.
    src.emit("ping");

    // Send a 'usermessage' event with some data. JS objects will be serialized to JSON automatically.
    src.emit("usermessage", {
      userId: 1,
      text: "Hello!",
    });

    src.close();
  });
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
app.use(async (ctx) => {
  const timer = ctx.useStore(TimingStore).createTimer(ctx.req.path);

  timer.start();
  await ctx.next();
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
      path: "/some/path",
      href: "http://localhost:3000/some/path",
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
    global(name) {},
    redirect(to) {},
  };

  // Once all handlers have run the response is created from the state of the context object.
  // If an error is thrown the server responds with 500 and a serialized error object. Server can be configured with options to exclude the stack trace or use a custom message for production builds.
});

// Express-style verb methods to handle routes. Pictured with multiple middleware functions.
app.onGet(
  "/some/url",
  (ctx) => {
    const auth = ctx.useStore(AuthStore);
    // Admin check. Presume `auth` is added by an auth middleware that runs before this.
    if (!auth.isAdmin) {
      return ctx.redirect("/other/path");
    }
  },
  (ctx) => {
    // Analytics.
    ctx.useStore(AnalyticsStore).pageView(request.location.pathname);
    return ctx.next();
  },
  (ctx) => {
    // Response time recorder.
    const timer = ctx.useStore(TimingStore).createTimer(request.location.pathname);

    timer.start();
    await ctx.next();
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

router.onGet("/", () => {
  return "OK"; // Return a body
});

router.onGet("manual/json", (req, ctx) => {
  ctx.setHeader("content-type", "application/json");

  return JSON.stringify({
    message: "This is returned as string, but content-type is set to application/json",
  });
});

router.onGet("auto/json", () => {
  return {
    message: "This is returned as an object, so content-type is inferred as application/json",
  };
});

export default router;
```

Then import this into the main server file and `.mount` it.

```js
import routes from "./router.js";

app.addRouter(routes);
app.addRouter("/sub", routes); // To mount routes under a sub path.
```

## Server Rendered Pages

Instead of JSON, you can return elements to render using `h()` or JSX. This returns an HTML response.

```js

```

---

🦆
