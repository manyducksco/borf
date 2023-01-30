# Testing Utils

`woofe/testing` includes tools for automated testing.

## Testing globals (and HTTP calls)

```js
import { wrapStore, makeMockHTTP } from "woofe/testing";

const mockHTTP = makeMockHTTP((on) => {
  // Define a mock responder for requests matching 'POST /users/create'
  on.post("/users/create", (ctx) => {
    ctx.response.status = 200;

    return {
      user: {
        id: 1,
        name: ctx.request.body.name,
        createdAt: new Date(),
      },
    };
  });

  on.delete("/users/:id", (ctx) => {
    ctx.response.status = 204;
  });
});

// A store that makes HTTP calls:
class UserStore extends Store {
  setup(ctx) {
    const http = ctx.useStore("http");

    function createUser(name) {
      return http.post("/users/create").body({ name });
    }

    function deleteUser(id) {
      return http.delete(`/users/${id}`);
    }

    return {
      createUser,
      deleteUser,
    };
  }
}

// And to test (pictured in Jest):
test("API calls return expected response", async () => {
  const userStore = wrapStore(UserStore, {
    stores: [{ store: "http", exports: mockHTTP }],
  });

  // Run lifecycle hooks
  await userStore.connect();

  // Access the exported object at 'exports'
  const createRes = await useStore.exports.createUser("Jimbo Jones");

  expect(createRes.status).toBe(200);
  expect(createRes.body.name).toBe("Jimbo Jones");

  const deleteRes = await userStore.exports.deleteUser(createRes.body.user.id);

  expect(deleteRes.status).toBe(204);
});
```

This can also be done with Views. The view wrapper simulates rendering, allowing you to query for "rendered" DOM nodes without actually displaying anything.

```tsx
import test from "ava";
import { wrapView } from "woofe/testing";
import { SomeView } from "./SomeView";

test("works", async (t) => {
  const view = wrapView(SomeView, {
    // Provide options:
    stores: [],
    attrs: {},
  });

  // Set up
  await view.connect();

  // Check that button is not rendered with default attributes.
  t.falsy(view.querySelector("button[data-test-id='the-button']"));

  // Check that button is rendered when showButton is true.
  view.attrs.set("showButton", true);
  t.truthy(view.querySelector("button[data-test-id='the-button']"));

  // Check that button is not rendered when showButton is false.
  view.attrs.set("showButton", false);
  t.falsy(view.querySelector("button[data-test-id='the-button']"));

  // Tear down
  await view.disconnect();
});
```
