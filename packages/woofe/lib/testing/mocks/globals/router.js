import { makeState } from "../../../helpers/state.js";

export default function mockRouter(ctx) {
  const $$path = makeState("/test");
  const $$route = makeState("/test");
  const $$params = makeState({});
  const $$query = makeState({});

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
