import { HTTP } from "./HTTP.js";
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/test", (req, res, ctx) => {
    console.log({ req, res, ctx });
    setTimeout(() => {
      res(ctx.json({ example: 123 }));
    }, 10);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("middleware", () => {
  describe("use", () => {
    test.skip("", () => {});
  });
});

describe("get", () => {
  test("asdf", () => {
    const http = new HTTP();
    const res = http.get("/test");

    console.log(res.body());

    res.body((value) => {
      expect(res.isLoading()).toBe(false);
      expect(value).toStrictEqual({
        example: 123,
      });
    });

    expect(res.isLoading()).toBe(true);
    expect.assertions(2);
  });
});
