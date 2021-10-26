import { Router } from "./Router";

function createMockHistory() {
  return {
    pushState: jest.fn(),
  };
}

test("asdf", () => {
  const history = createMockHistory();
  const router = new Router({
    history,
  });

  router.on("/example", (route) => {});
});
