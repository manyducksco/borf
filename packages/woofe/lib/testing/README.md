# Testing Utils

`@woofjs/client` includes tools for unit testing its own views and globals as well as views and globals created by users
for their own apps.

## Testing globals (and HTTP calls)

```js
import { wrapGlobal, makeMockHTTP } from "@woofjs/client/testing";

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

// A global that makes HTTP calls:
function UserGlobal(ctx) {
  const http = ctx.global("http");

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
```

And to test (pictured in Jest):

```js
test("API calls return expected response", async () => {
  const userGlobal = wrapGlobal(UserGlobal, {
    globals: [{ name: "@http", global: mockHTTP }],
  });

  // Run lifecycle hooks
  userGlobal.beforeConnect();
  userGlobal.afterConnect();

  // Access the exported object at 'exports'
  const createRes = await userGlobal.exports.createUser("Jimbo Jones");

  expect(createRes.status).toBe(200);
  expect(createRes.body.name).toBe("Jimbo Jones");

  const deleteRes = await userGlobal.exports.deleteUser(createRes.body.user.id);

  expect(deleteRes.status).toBe(204);
});
```
