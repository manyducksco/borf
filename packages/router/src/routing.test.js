import { FragTypes, makeRouter, parseRoute, matchRoute, sortRoutes } from "./routing.js";

describe("makeRouter", () => {
  test("routes", () => {
    const router = makeRouter();

    router.on("test", { data: 1 });
    router.on("api/thing/:id", { data: 2 });
    router.on("api/thing/test", { data: 3 });
    router.on("api/wild/*", { data: 4 });

    expect(router.match("test")).toBeTruthy();
    expect(router.match("test").props.data === 1);

    expect(router.match("api/thing/test")).toBeTruthy();
    expect(router.match("api/thing/test").props.data === 3);

    expect(router.match("api/thing/5")).toBeTruthy();
    expect(router.match("api/thing/5").props.data === 2);

    expect(router.match("api/wild/test/hello")).toBeTruthy();
    expect(router.match("api/wild/test/hello").props.data === 4);
    expect(router.match("api/wild/test/hello").params.wildcard === "test/hello");
  });
});

describe("parseRoute", () => {
  test("parses routes", () => {
    expect(parseRoute("/some-path/:id/edit")).toStrictEqual({
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

    expect(parseRoute("/some-path/:one///:two/:three/asdf")).toStrictEqual({
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
      { ...parseRoute("items/:id"), handlers: [] },
      { ...parseRoute("/"), handlers: [] },
      { ...parseRoute("items/:id/edit"), handlers: [] },
      { ...parseRoute("/items/:id/:fish/*"), handlers: [] },
      { ...parseRoute("items/what"), handlers: [] },
    ]);

    expect(matchRoute(routes, "")).toMatchObject({
      path: "",
      route: "",
      params: {},
    });

    expect(matchRoute(routes, "items")).toMatchObject({
      path: "items",
      route: "items",
      params: {},
    });

    expect(matchRoute(routes, "items/what")).toMatchObject({
      path: "items/what",
      route: "items/what",
      params: {},
    });

    expect(matchRoute(routes, "items/what/edit")).toMatchObject({
      path: "items/what/edit",
      route: "items/:id/edit",
      params: {
        id: "what",
      },
    });

    expect(matchRoute(routes, "items/555/toast/oh/nice/5/...")).toMatchObject({
      path: "items/555/toast/oh/nice/5/...",
      route: "items/:id/:fish/*",
      params: {
        id: "555",
        fish: "toast",
      },
      wildcard: "oh/nice/5/...",
    });

    expect(matchRoute(routes, "aaa/bbb/ccc")).toMatchObject({
      path: "aaa/bbb/ccc",
      route: "*",
      params: {},
      wildcard: "aaa/bbb/ccc",
    });
  });
});
