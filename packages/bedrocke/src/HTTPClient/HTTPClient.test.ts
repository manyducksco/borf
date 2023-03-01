import test from "ava";
import { HTTPClient } from "./HTTPClient.js";
import { makeMockFetch } from "./makeMockFetch.js";

test("Test Drive", async (t) => {
  const fetch = makeMockFetch([
    {
      method: "get",
      url: "/url",
      respond: (ctx) => {
        return {
          data: "これはデータです",
        };
      },
    },
  ]);
  const http = new HTTPClient({ fetch });

  const response = await http.get<{ data: string }>("/url").send();

  t.is(response.status, 200);
  t.deepEqual(response.body, { data: "これはデータです" });
});

test("configure once, send multiple times", async (t) => {
  const fetch = makeMockFetch([
    {
      method: "get",
      url: "/url",
      respond: (ctx) => {
        return {
          data: "これはデータです",
        };
      },
    },
  ]);
  const http = new HTTPClient({ fetch });

  const req = http.get("/url");

  const first = await req.send();
  const second = await req.send();

  http.use(async (req, next) => {
    req.setHeader("x-super-secret-auth", "Bearer 55555");

    // Next will run the next middleware and return a response object.
    const res = await next();
  });

  t.is(fetch.mock.requests.length, 2, "fetch should have been called twice");
});
