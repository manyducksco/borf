# Testing Utils

`@woofjs/client` includes tools for unit testing its own components and services as well as components and services created by users for their own apps.

## Testing services (and HTTP calls)

```js
import { wrapService, makeMockHTTP } from "@woofjs/client/testing";

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

// A service that makes HTTP calls:
const UserService = (ctx) => {
  const { http } = ctx.services;

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
};
```

And to test (pictured in Jest):

```js
test("API calls return expected response", async () => {
  const userService = wrapService(UserService, {
    services: {
      http: mockHTTP,
    },
  });

  // Run lifecycle hooks
  userService.beforeConnect();
  userService.afterConnect();

  // Access the exported object at 'exports'
  const createRes = await userService.exports.createUser("Jimbo Jones");

  expect(createRes.status).toBe(200);
  expect(createRes.body.name).toBe("Jimbo Jones");

  const deleteRes = await userService.exports.deleteUser(createRes.body.user.id);

  expect(deleteRes.status).toBe(204);
});
```
