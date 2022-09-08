import { wrapService } from "./wrapService.js";
import { makeMockHTTP } from "./makeMockHTTP.js";

/**
 * A service that makes HTTP requests through the @http service.
 */
function UserService(ctx) {
  const http = ctx.getService("http");

  async function getUsers() {
    return http.get("/users").then((res) => res.body);
  }

  return {
    getUsers,
  };
}

/**
 * A mock HTTP service that responds to HTTP requests.
 */
const mockHTTP = makeMockHTTP((http) => {
  http.get("/users", (ctx) => {
    return [
      { id: 1, user: "Jimbo Jones" },
      { id: 2, user: "Snorlax" },
    ];
  });
});

test("provides mock services to wrapped service", async () => {
  const service = wrapService(UserService, (ctx) => {
    ctx.service("http", mockHTTP);
  });

  const users = await service.exports.getUsers();

  expect(users).toStrictEqual([
    { id: 1, user: "Jimbo Jones" },
    { id: 2, user: "Snorlax" },
  ]);
});
