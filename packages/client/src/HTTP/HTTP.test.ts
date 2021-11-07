import { HTTP } from "./HTTP";
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.get("/test", (req, res, ctx) => {
    return res(ctx.json({ example: 123 }));
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
    const res = HTTP.get("/test");

    expect.assertions(2);
    expect(res.isLoading.current).toBe(true);

    res.listen(() => {
      expect(res.isLoading.current).toBe(false);
      console.log(res.current);
    });

    console.log(res);
  });
});
