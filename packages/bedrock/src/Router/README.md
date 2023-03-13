# Router

A Router matches paths against a set of patterns, returning the most specific match.

Router is a low-level building block for matching strings that follow a URL-like pattern. It doesn't deal with browser history, for example, but it can be used to build a client side router that does. Router is just as comfortable on the server side, matching routes to determine which handler function to respond with.

## Creating a Router

```js
import { Router } from "@borf/bedrock";

const router = new Router();
```

## Adding Routes

Call the `addRoute` method to register a new route. Routes take a pattern string and a `meta` object, which can contain anything you want to store. The following example shows a `meta` object that determines which view to display when the user edit pattern is matched.

```js
router.addRoute("/users/{#id}/edit", { view: UserEditView });
```

## Matching Routes

Call the `match` method to get the nearest match. Returns `undefined` if no routes match.

```js
const match = router.match("/users/123/edit");

if (match) {
  render(match.meta.view);
} else {
  render(NotFoundView);
}
```

The `match` method takes an optional `options` object which you can use to specify the conditions under which a route will match.

```js
const match = router.match("/users/123/edit", {
  willMatch: (route) => {
    // Only match a route that has a `view` defined in its meta object.
    return route.meta.view != null;
  },
});
```
