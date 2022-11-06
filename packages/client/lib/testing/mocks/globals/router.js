export default function mockRouter(ctx) {
  const $$path = ctx.state("/test");
  const $$route = ctx.state("/test");
  const $$params = ctx.state({});
  const $$query = ctx.state({});

  return {
    $path: $$path.readable(),
    $route: $$route.readable(),
    $params: $$params.readable(),
    $$query: $$query,

    back() {},
    forward() {},
    navigate() {},
  };
}
