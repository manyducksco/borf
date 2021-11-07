```js
import { HTTP } from "***";

interface RequestContext {
  url: string;
  status: number | null;
  headers: {
    //
    [name: string]: string,
  };
  body: any;
}

function parseJSON() {
  return async (ctx, next) => {
    await next();

    if (ctx.status !== 204) {
      if (ctx.headers["content-type"] === "application/json") {
        ctx.body = await ctx.response.json();
      }
    }
  };
}

// koa middleware style with async/await
HTTP.use(async (ctx, next) => {
  const cached = await cache.get(ctx.url);

  if (cached) {
    // send a response without actually making a request
    // this will stop any remaining middleware and immediately switch to the response stage
    // this also sets ctx.synthetic = true
    ctx.respond({
      status: 200,
      body: cached,
    });
  } else {
    await next();
    await cache.set(ctx.body);
  }
});

HTTP.get("/some/resource");

HTTP.post("/some/resource", {
  headers: {},
  body: data, // if data is an object, JSON stringify and default content type to application/json
});

HTTP.post(
  "/some/resource",
  async (ctx, next) => {
    await next();
    console.log(`Logging request: ${ctx.method} ${ctx.url}`);
  },
  {
    body: data,
  }
);

// Signature: HTTP.method(path, ...middleware?, options?)
// middleware on request is run before global middleware

const req = HTTP.get("/api/data", parseJSON());
const id = req.map((current) => current.body.id);

req.isLoading; // listenable (boolean)
req.error; // listenable (Error)

req.reload();
// when reloading, existing data stays but error is cleared and isLoading is set to true

req.current; // contains stripped down version of response context without `type` or `state` fields
```

HTTP client with middleware. Use cases for middleware:

- Add auth header to all outgoing requests
- Parse incoming responses automatically
- Check permissions and return response locally before actually making request
- Log response errors

Returns a request object which is a Source and has a `reload` method to perform the request again.

## Questions

How would paging work?
