import { Router } from "./Router";
import { createMemoryHistory } from "history";

function createRouter() {
  const history = createMemoryHistory();
  const router = new Router({
    history,
  });
  const outlet = document.createElement("div");

  router.connect(outlet);

  return {
    history,
    router,
    outlet,
  };
}

describe("routing", () => {
  test("runs route handler when its path is matched", () => {
    const { history, router } = createRouter();

    router.on("/test", (route) => {
      expect(route.path).toBe("/test");
    });

    history.push("/test");

    expect.hasAssertions();
  });

  test("wildcard receives unmatched routes", () => {
    const { history, router } = createRouter();

    router.on("/test", (route) => {});

    router.on("*", (route) => {
      expect(route.path).toBe("*");
      expect(route.href).toBe("/nope");
    });

    history.push("/nope");

    expect.hasAssertions();
  });
});

describe("route object", () => {
  describe("redirect", () => {
    test("redirects to another path", () => {
      const { history, router } = createRouter();

      router.on("/test", (route) => {
        route.redirect("relative?from=start"); // no "/" is relative path
      });

      router.on("/test/relative", (route) => {
        expect(route.query.from).toBe("start");
        route.redirect("/absolute?from=rel");
      });

      router.on("/absolute", (route) => {
        expect(route.query.from).toBe("rel");
      });

      history.push("/test");

      expect.hasAssertions();
    });
  });

  describe("next", () => {
    test("moves to next route and passes data param", () => {
      const { history, router } = createRouter();

      router.on(
        "/test",
        (route) => {
          route.next("hello");
        },
        (route, data) => {
          expect(data).toBe("hello");
        }
      );

      history.push("/test");

      expect.hasAssertions();
    });
  });

  // describe("switch", () => {
  //   test("returns a component");
  // });
});
