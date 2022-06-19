# Testing Utils

`@woofjs/client` includes tools for unit testing its own components and services as well as components and services created by users for their own apps.

## Testing services (and HTTP calls)

```js
import { wrapService, makeMockHTTP } from "@woofjs/client/testing";

const mockHTTP = makeMockHTTP((self) => {
  // Define a mock responder for requests matching 'POST /users/create'
  self.post("/users/create", (ctx) => {
    ctx.response.status = 200;

    return {
      user: {
        id: 1,
        name: ctx.request.body.name,
        createdAt: new Date(),
      },
    };
  });

  self.delete("/users/:id", (ctx) => {
    ctx.response.status = 204;
  });
});

// A service that makes HTTP calls:
function UserService(self) {
  function createUser(name) {
    return self.getService("@http").post("/users/create").body({ name });
  }

  function deleteUser(id) {
    return self.getService("@http").delete(`/users/${id}`);
  }

  return {
    createUser,
    deleteUser,
  };
}

// And a wrapped version of that service that uses a mock version of @http:
const WrappedUserService = wrapService(UserService, (self) => {
  self.service("@http", mockHTTP);
});
```

And to test:

```js
test("API calls return expected response", (t) => {
  t.plan(3);
  t.timeout(500);

  const service = t.service(WrappedUserService, {
    /* options */
  });

  service.createUser("Jimbo Jones").then((res) => {
    t.equals(res.status, 200);
    t.equals(res.body.name, "Jimbo Jones");
  });

  service.deleteUser(1).then((res) => {
    t.equals(res.status, 204);
  });
});
```
