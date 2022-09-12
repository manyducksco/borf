import { wrapGlobal } from "./wrapGlobal.js";
import { makeMockHTTP } from "../makers/makeMockHTTP.js";

/**
 * A service that makes HTTP requests through the @http service.
 */
function UserService() {
  const http = this.service("http");

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
const mockHTTP = makeMockHTTP(function () {
  this.get("/users", (ctx) => {
    return [
      { id: 1, user: "Jimbo Jones" },
      { id: 2, user: "Snorlax" },
    ];
  });
});

test("provides mock services to wrapped service", async () => {
  const global = wrapGlobal(UserService, function () {
    this.global("http", mockHTTP);
  });

  const users = await global.exports.getUsers();

  expect(users).toStrictEqual([
    { id: 1, user: "Jimbo Jones" },
    { id: 2, user: "Snorlax" },
  ]);
});
