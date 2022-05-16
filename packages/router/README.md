# @woofjs/router

Basic route matching logic for libraries. Routing is baked into the core of `@woofjs/client` and `@woofjs/server`, so you don't need to install this if you're creating an app.

```js
import { makeRouter } from "@woofjs/router";

const router = makeRouter();

router.on("api/users/:id/*", { data: "anything" });

const nested = makeRouter();
nested.on("route", { id: 2 });

// Mount routers on routers to automatically match wildcards against that router.
router.on("api/users/:id/*", nested);

// Routes are ordered by specificity, so this route will be matched before the one above.
const off = router.on("api/users/new/*", { number: 2 });

off(); // router.on returns a function you can call to unregister the route.

const route = router.match("/api/users/362/edit?admin=true");

const route = router.match("/api/users/362/edit?admin=true", {
  // When a route matches, willMatch decides to return it or to keep looking.
  willMatch(route) {
    return route.props.method === "get"
  }
});

// Matches will return an object like this:
{
  path: "api/users/362/edit",
  route: "api/user/:id/*",
  params: { id: "362" },
  query: { admin: "true" },
  wildcard: "edit",
  props: { data: "anything" },
};
```
