import { FragTypes, parseRoute, matchRoute, sortedRoutes } from "./Router";

test("parses routes", () => {
  expect(parseRoute("/some-path/:id/edit")).toStrictEqual([
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
  ]);

  expect(parseRoute("/some-path/:one///:two/:three/asdf")).toStrictEqual([
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
  ]);

  expect(parseRoute("asdf/*")).toStrictEqual([
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
  ]);
});

test("throws if wildcard isn't correctly placed", () => {
  expect(() => parseRoute("asdf/*/test")).toThrowError(
    /must be at the end of a route/
  );

  expect(() => parseRoute("*")).not.toThrowError();
  expect(() => parseRoute("home/*")).not.toThrowError();
});

test("matches routes", () => {
  const routes = sortedRoutes([
    { fragments: parseRoute("*"), handlers: [] },
    { fragments: parseRoute("items"), handlers: [] },
    { fragments: parseRoute("items/:id"), handlers: [] },
    { fragments: parseRoute("/"), handlers: [] },
    { fragments: parseRoute("items/:id/edit"), handlers: [] },
    { fragments: parseRoute("/items/:id/:fish/*"), handlers: [] },
    { fragments: parseRoute("items/what"), handlers: [] },
  ]);

  expect(matchRoute(routes, "")).toMatchObject({
    path: "",
    route: "/",
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
      wildcard: "oh/nice/5/...",
    },
  });

  const match4 = matchRoute(routes, "aaa/bbb/ccc");
  expect(match4).toBe({
    path: "aaa/bbb/ccc",
    route: "*",
    params: {
      wildcard: "aaa/bbb/ccc",
    },
  });
});
