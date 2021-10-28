import { Router } from "./Router";
import { createMemoryHistory } from "history";

test("runs route handler when its path is matched", () => {
  const history = createMemoryHistory();
  const router = new Router({
    history,
  });

  expect.assertions(1);

  router.on("/example", (route) => {
    expect(route.path).toBe("/example");
  });

  router.connect(document.createElement("div"));

  history.push("/example");
});
