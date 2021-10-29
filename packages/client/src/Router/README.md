# Router

Mounts different components when the browser's URL changes. This is a "lazy" router, so the previous components will not be unmounted until another route that returns a component is mounted to replace it.

## How to Use

Import and instantiate:

```js
import { Router } from "***";

const router = new Router();
```

Define a route:

```js
router.on("/", HomeComponent);
```

Listen for route changes and render route components into an element:

```js
router.connect("#app");
```

### Stacked Routes

Routes take a path and then any number of route functions, each of which can trigger the next in line by calling `route.next()`. You can use this to preload data:

```js
router.on(
  "/person/:id",
  // DATA HANDLER
  (route) => {
    fetch(`/api/people/${route.params.id}`) // 1.
      .then((res) => res.json())
      .then((json) => {
        route.next(json); // 3.
      });

    return LoaderComponent(); // 2.
  },
  // PAGE HANDLER
  (route, data) => {
    return PersonPage(data); // 4.
  }
);
```

1. Begin an API call
2. Return a component to display while loading
3. When the API call finishes, call `route.next(data)`, passing the preloaded data
4. Page component is displayed, replacing loading component

If a route function does not return a component, the previous route will remain mounted until the router runs a handler that does return a component.

> TODO: On a fresh page load, if a data handler doesn't return something the page will be blank until the data finishes loading. Maybe we could have a fallback route that displays until the first route loads that returns a component. Or we could have a way to tell if there was a previous route and handle it in function.
>
> I would handle this by including a loading screen with the app HTML. Use an onFirstMount event on the router to remove that loading screen when the first route kicks in.

### The Route Object

The first argument passed to each handler function is an object with these fields:

```ts
interface RouteObject {
  /**
   * Full path as it appears in the URL bar.
   */
  href: string;

  /**
   * Router path as it was written to register the route.
   */
  path: string;

  /**
   * Keys and values for each :param matched in the route.
   */
  params: {
    [name: string]: string;
  };

  /**
   * Keys and values for each query parameter. All values are strings until parsed by you.
   */
  query: {
    [name: string]: string;
  };

  /**
   * Continues to the next handler if there is one. Throws an error if there isn't.
   * Call this function with a value and it will be passed as the second parameter to the next handler.
   */
  next: (data?: any) => void;

  /**
   * Go to another route.
   */
  redirect: (path: string) => void;

  /**
   * Define subroutes and render their contents wherever this component is placed when the route is matched.
   */
  switch: (routes: RouteArray[]) => Component;
}
```

### Nested Routes

The `switch` function takes an array of arrays, also known as a two-dimensional array. The outer array is a list of routes, and each inner array is a path followed by one or more handler functions; the same pattern as `router.on` in the top-level router object.

```js
router.on("/example", (route) => {
  return E("div", {
    class: "container",
    children: [
      route.switch([
        ["sub", subroute],
        ["sub2/:id", subroute2],
      ]),
    ],
  });
});

// This handler is now reachable at /example/sub
function subroute(route) {
  // return component
}

// This handler is now reachable at /example/sub2/:id
function subroute2(route) {
  // return component
}
```

### Idea: Transitions

Wrap a component with a transition handler. The router will perform an `enter` transition when this component is mounted and an `exit` transtion when unmounted.

```js
router.on("/example", (route) => {
  return route.transition(SomeComponent, {
    enter: {
      duration: 400,
      name: "fadeInUp",
    },
    exit: {
      duration: 600,
      name: "fadeOutDown",
    },
  });
});
```
