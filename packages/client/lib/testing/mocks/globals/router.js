export default function mockRouter(ctx) {
  ctx.defaultState = {
    path: "/test",
    route: "/test",
    params: {},
    query: {},
  };

  return {
    $path: ctx.readable("path"),
    $route: ctx.readable("route"),
    $params: ctx.readable("params"),
    $$query: ctx.writable("query"),

    back() {},
    forward() {},
    navigate() {},
  };
}
