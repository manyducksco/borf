import { wrapService } from "./wrapService.js";
import { makeMockHTTP } from "./makeMockHTTP.js";

/**
 * A service that makes HTTP requests through the @http service.
 */
function UserService(self) {
  async function getUsers() {
    return self
      .getService("@http")
      .get("/users")
      .then((res) => res.body);
  }

  return {
    getUsers,
  };
}

/**
 * A mock HTTP service that responds to HTTP requests as the @http service.
 */
const mockHTTP = makeMockHTTP((self) => {
  self.get("/users", (ctx) => {
    return [
      { id: 1, user: "Jimbo Jones" },
      { id: 2, user: "Snorlax" },
    ];
  });
});

/**
 * A wrapped version of the component that uses the mock @http service.
 */
const makeWrapped = wrapService(UserService, (wrapper) => {
  wrapper.service("@http", mockHTTP);
});

test("provides mock services to wrapped service", async () => {
  const service = makeWrapped();

  const users = await service.exports.getUsers();

  expect(users).toStrictEqual([
    { id: 1, user: "Jimbo Jones" },
    { id: 2, user: "Snorlax" },
  ]);
});
