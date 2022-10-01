import { wrapGlobal } from "./wrapGlobal.js";
import { makeMockHTTP } from "../makeMockHTTP.js";

/**
 * A service that makes HTTP requests through the @http service.
 */
function UserGlobal(ctx) {
  const http = ctx.global("http");

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
const mockHTTP = makeMockHTTP((ctx) => {
  ctx.get("/users", () => {
    return [
      { id: 1, user: "Jimbo Jones" },
      { id: 2, user: "Snorlax" },
    ];
  });
});

test("provides mock globals to wrapped service", async () => {
  const global = wrapGlobal(UserGlobal, (ctx) => {
    ctx.global("http", mockHTTP);
  });

  const users = await global.exports.getUsers();

  expect(users).toStrictEqual([
    { id: 1, user: "Jimbo Jones" },
    { id: 2, user: "Snorlax" },
  ]);
});
