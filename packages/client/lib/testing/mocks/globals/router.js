export default function mockRouter() {
  this.defaultState = {
    path: "/test",
    route: "/test",
    params: {},
    query: {},
  };

  return {
    $path: this.readable("path"),
    $route: this.readable("route"),
    $params: this.readable("params"),
    $$query: this.writable("query"),

    back() {},
    forward() {},
    navigate() {},
  };
}
