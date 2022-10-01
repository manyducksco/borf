# 🐕☁️ @woofjs/server

> CAUTION: This package is extremely early in development. Breaking changes are expected and not all documented features are implemented yet.

JSON API companion server for dogs. 🐕

Support your client-side app with an API or create a dynamic server-rendered app.

## Basics and Routing

```js
import { makeApp } from "@woofjs/server";
import example from "./globals/example";

const app = makeApp();

const corsDefaults = {
  allowOrigin: ["*"],
  allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
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

app.static(); // Add default static directory (client bundle output)
app.static("/static/path", "/path/to/actual/dir"); // Add custom static directory

app.fallback(); // Fallback to index.html for capable requests to support client side routing.
app.fallback("/some/weird/index.html"); // Specify your own index.html fallback path.

// Share logic and state between handlers with globals.
// Each service is created once per request.
// Two API calls will use two different instances, but all middleware in the same API call will use one instance.
app.global("example", example);

// Create API routes with functions named after HTTP methods (`get`, `post`, `delete`, etc.)
app.get("/some-route", function (ctx) {
  const example = ctx.global("example");

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
app.eventSource("/events", (ctx) => {
  // Send a message with content 'whatever'.
  ctx.send("whatever");

  // Send a 'ping' event.
  ctx.emit("ping");

  // Send a 'usermessage' event with some data. JS objects will be serialized to JSON automatically.
  ctx.emit("usermessage", {
    userId: 1,
    text: "Hello!",
  });

  ctx.close();
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
```

## Middleware

```js
// Mount middleware to run for every request.
app.use(async (ctx) => {
  const timer = ctx.global("timing").createTimer(ctx.req.path);

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
app.get(
  "/some/url",
  (ctx) => {
    const auth = ctx.global("auth");
    // Admin check. Presume `auth` is added by an auth middleware that runs before this.
    if (!auth.isAdmin) {
      return ctx.redirect("/other/path");
    }
  },
  (ctx) => {
    // Analytics.
    ctx.global("analytics").pageView(request.location.pathname);
    return ctx.next();
  },
  (ctx) => {
    // Response time recorder.
    const timer = ctx.global("timing").createTimer(request.location.pathname);

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
import { makeRouter } from "@woofjs/server";

const router = makeRouter();

router.get("/", () => {
  return "OK"; // Return a body
});

router.get("manual/json", (ctx) => {
  ctx.response.headers.set("content-type", "application/json");

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

## Server Rendered Pages

Instead of JSON, you can return elements to render using `h()` or JSX. This returns an HTML response.

```js

```

### Server Components

The server supports function components similar to `@woofjs/client`. The biggest difference is that the attributes here are passed as a plain object rather than a state, and there are no lifecycle methods. Server components are run once to generate a chunk of HTML.

```js
export function Header(attrs, self) {
  return (
    <header>
      <h1>{attrs.title}</h1>
    </header>
  );
}
```

And then use it in a page:

```js
import { Header } from "./views/Header";

app.get("/home", (ctx) => {
  return (
    <main>
      <Header title="Welcome!" />
      <p>This is the home page.</p>
    </main>
  );
});
```

It's also possible to create an async component if you need to load data before rendering.

```js
export async function UserCard(attrs, self) {
  const db = self.getService("db");
  const user = await db("users").where("id", attrs.userId);

  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.bio}</p>

      <a href={`/users/${attrs.userId}/more`}>More Info</a>
    </div>
  );
}
```

These can be used in exactly the same way as non-async components, but the server will wait to respond until all async components have resolved. Async components can keep data fetching closer to where the data is needed, though too many async components can slow down response time. Data can also be fetched at the top level of a route and passed down to components as attributes.

```js
import { Header } from "./views/Header";
import { UserCard } from "./views/UserCard";

app.get("/users/:userId", (ctx) => {
  const { userId } = ctx.request.params;

  return (
    <main>
      <Header title="User" />
      <UserCard userId={userId} />
    </main>
  );
});
```

### Implementation Notes

- h() function will render HTML when called with a tagname
- h() function will render a component to get HTML when called with a function

The h() calls look like this:

```js
h("main", null, [
  h(Header, { title: "User" }),
  h("div", null, [
    h("h3", null, user.name),
    h("p", null, user.bio),
    h("a", { href: `/users/${attrs.userId}/more` }, "More Info"),
  ]),
]);
```

The resulting HTML string looks like this:

```html
<main>
  <header>
    <h1>User</h1>
  </header>
  <div>
    <h3>Jimbo Jones</h3>
    <p>Just some guy.</p>
    <a href="/users/2/more">More Info</a>
  </div>
</main>
```

When rendering an element:

- Process children first, so components are resolved down to HTML
- Return HTML string
- All children are strings before returning the element

---

🦆
