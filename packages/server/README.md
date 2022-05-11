# @woofjs/server

JSON API companion server for dogs. 🐕

Support your Woof app with a backend.

```js
import { makeServer } from "@woofjs/server";

const server = makeServer();

// Options for serving a woof app.
server.app("./app"); // String for a relative path to the app folder
server.app(false); // Non-string falsy value disables static app server, while truthy value enables it with a default path of "./app"

server.use((ctx) => {
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

// Mount components on routes to return HTML. Preload works for loading data before responding.
server.route("/:id", ($, self) => {
  // Gets services registered on this server.
  self.getService("something");

  self.loadRoute((show, done) => {
    setTimeout(done, 100); // wait 100ms for no reason
  });

  return <div class="page">Content</div>;
});

// Express-style verb methods to handle routes.
server.get(
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

server.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
```

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

server.mount(routes);
server.mount("/sub", routes); // To mount routes under a sub path.
```

---

🦆
