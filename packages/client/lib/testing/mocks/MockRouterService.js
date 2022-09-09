import { makeState } from "../../state/makeState.js";

export function MockRouterService() {
  const $path = makeState("/test");
  const $route = makeState("/test");
  const $params = makeState({});
  const $query = makeState({});

  return {
    $path: $path.map(),
    $route: $route.map(),
    $params: $params.map(),
    $query,

    back() {},
    forward() {},
    navigate() {},
  };
}
