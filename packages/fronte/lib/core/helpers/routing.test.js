import { FragTypes, parseRoute, matchRoute, sortRoutes } from "./routing.js";

describe("parseRoute", () => {
  test("parses routes", () => {
    expect(parseRoute("/some-path/{id}/edit")).toStrictEqual({
      fragments: [
        {
          type: FragTypes.Literal,
          name: "some-path",
          value: "some-path",
        },
        {
          type: FragTypes.Param,
          name: "id",
          value: null,
        },
        {
          type: FragTypes.Literal,
          name: "edit",
          value: "edit",
        },
      ],
    });

    expect(parseRoute("/some-path/{one}///{two}/{three}/asdf")).toStrictEqual({
      fragments: [
        {
          type: FragTypes.Literal,
          name: "some-path",
          value: "some-path",
        },
        {
          type: FragTypes.Param,
          name: "one",
          value: null,
        },
        {
          type: FragTypes.Param,
          name: "two",
          value: null,
        },
        {
          type: FragTypes.Param,
          name: "three",
          value: null,
        },
        {
          type: FragTypes.Literal,
          name: "asdf",
          value: "asdf",
        },
      ],
    });

    expect(parseRoute("asdf/*")).toStrictEqual({
      fragments: [
        {
          type: FragTypes.Literal,
          name: "asdf",
          value: "asdf",
        },
        {
          type: FragTypes.Wildcard,
          name: "*",
          value: null,
        },
      ],
    });
  });

  test("throws if wildcard isn't correctly placed", () => {
    expect(() => parseRoute("asdf/*/test")).toThrowError(/must be at the end of a route/);

    expect(() => parseRoute("*")).not.toThrowError();
    expect(() => parseRoute("home/*")).not.toThrowError();
  });
});

describe("matchRoute", () => {
  test("matches routes", () => {
    const routes = sortRoutes([
      { ...parseRoute("*"), handlers: [] },
      { ...parseRoute("items"), handlers: [] },
      { ...parseRoute("items/{#id}"), handlers: [] },
      { ...parseRoute("/"), handlers: [] },
      { ...parseRoute("items/{#id}/edit"), handlers: [] },
      { ...parseRoute("/items/{#id}/{fish}/*"), handlers: [] },
      { ...parseRoute("items/what"), handlers: [] },
    ]);

    expect(matchRoute(routes, "")).toMatchObject({
      path: "/",
      route: "/",
      params: {},
    });

    expect(matchRoute(routes, "items")).toMatchObject({
      path: "/items",
      route: "/items",
      params: {},
    });

    expect(matchRoute(routes, "items/123")).toMatchObject({
      path: "/items/123",
      route: "/items/{#id}",
      params: {},
    });

    expect(matchRoute(routes, "items/123/edit")).toMatchObject({
      path: "/items/123/edit",
      route: "/items/{#id}/edit",
      params: {
        id: 123,
      },
    });

    expect(matchRoute(routes, "items/555/toast/oh/nice/5/...")).toMatchObject({
      path: "/items/555/toast/oh/nice/5/...",
      route: "/items/{#id}/{fish}/*",
      params: {
        id: 555,
        fish: "toast",
        wildcard: "/oh/nice/5/...",
      },
    });

    expect(matchRoute(routes, "aaa/bbb/ccc")).toMatchObject({
      path: "/aaa/bbb/ccc",
      route: "/*",
      params: {
        wildcard: "/aaa/bbb/ccc",
      },
    });
  });

  test("numeric fragments are more specific than non-numeric", () => {
    const routes = sortRoutes([
      { ...parseRoute("*"), handlers: [] },
      // Without numeric, these would have a conflict. With numeric they are distinct routes.
      { ...parseRoute("items/{name}"), handlers: [] },
      { ...parseRoute("items/{#id}"), handlers: [] },
    ]);

    expect(matchRoute(routes, "/items/123")).toMatchObject({
      path: "/items/123",
      route: "/items/{#id}",
      params: {
        id: 123,
      },
    });

    expect(matchRoute(routes, "/items/some-item")).toMatchObject({
      path: "/items/some-item",
      route: "/items/{name}",
      params: {
        name: "some-item",
      },
    });
  });
});
