# API request modeling

I want something like an ORM for API calls. It has type safety and optional runtime validation (maybe only in development mode by default). The point would be to model your API in Endpoints, hopefully clarifying how each API call is used and prevent typos and misconfigurations.

> Very work in progress.

```js
// Define an endpoint implemented by your API
class SaveUserEndpoint extends Endpoint {
  static method = "put";
  static uri = "/users/save";
}

// Create a new request to that endpoint
const req = new Request(SaveUserEndpoint, {
  body: {
    user: {
      /* ... */
    },
  },
});

// Make the call. The request can be defined once and called many times.
const res = await req.send();

// Quick usage without defining endpoints:
const res = await Request.put("/users/save", {
  body: {
    /* ... */
  },
});
```
