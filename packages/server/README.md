# @woofjs/server

JSON API companion server for dogs. 🐕

Support your client-side app with an API or create a dynamic server-rendered app.

## Basics and Routing

```js
import { makeApp } from "@woofjs/server";
import ExampleService from "./services/example";

const app = makeApp();

// By default, a server app will try to serve static files from `/public`. You can change this:
app.static(false); // Don't serve static files at all.
app.static("/static/path"); // Specify a custom path for static files.

// Share logic and state between handlers with services.
// Each service is created once per request.
// Two API calls will use two different instances, but all middleware in the same API call will use one instance.
app.service("example", ExampleService);

// Create API routes with functions named after HTTP methods (`get`, `post`, `delete`, etc.)
app.get("/some-route", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  return {
    message: "This is a JSON response.",
  };
});

// Create server-rendered HTML pages with `.route` and a component to render.
// This mirrors the routing from `@woofjs/client`, but rendered server side.
app.route("/other-route", ($, self) => {
  // Services can be accessed just like in client-side components.
  const { $message } = self.getService("example");

  return (
    <div>
      <h1>Server Rendered Page</h1>
      <p>This is an HTML page you visit in your browser.</p>
      <p>Message: {$message}</p>
    </div>
  );
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
```

## Middleware

```js
// Mount middleware to run for every request.
app.use((ctx) => {
  const timer = ctx.getService("timing").createTimer(ctx.req.path);

  timer.start();
  await ctx.next();
  timer.stop();

  timer.save();

  // ctx object has:
  ctx = {
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
    getService(name) {},
    async next() {},
    redirect(to) {},
  };

  // Once all handlers have run the response is created from the state of the context object.
  // If an error is thrown the server responds with 500 and a serialized error object. Server can be configured with options to exclude the stack trace or use a custom message for production builds.
});

// Express-style verb methods to handle routes. Pictured with multiple middleware functions.
app.get(
  "/some/url",
  ({ auth, redirect }) => {
    // Admin check. Presume `auth` is added by an auth middleware that runs before this.
    if (!auth.isAdmin) {
      return redirect("/other/path");
    }
  }
  ({ request, getService, next }) => {
    // Analytics.
    getService("analytics").pageView(request.location.pathname);
    return next();
  },
  ({ request, getService, next }) => {
    // Response time recorder.
    const timer = getService("timing").createTimer(request.location.pathname);

    timer.start();
    await next();
    timer.stop();

    timer.save();
  },
  ({ request, response }) => {
    response.status = 200;

    return {
      message: "response"
    };
  }
);
```

## Router

If you have many routes and you want to separate them into different files, use a Router. This has the same routing and component mounting options as the server.

```js
import { makeRouter } from "@woofjs/server";

const router = makeRouter();

router.get("/", () => {
  return "OK"; // Return a body
});

router.get("manual/json", (ctx) => {
  ctx.response.headers["content-type"] = "application/json";

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

app.mount(routes);
app.mount("/sub", routes); // To mount routes under a sub path.
```

---

🦆
