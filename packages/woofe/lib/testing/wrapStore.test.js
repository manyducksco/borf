import { Store } from "../core/classes/Store.js";
import { MockHTTP } from "./classes/MockHTTP.js";
import { wrapStore } from "./wrapStore.js";

class TestHTTP extends MockHTTP {
  respond(to) {
    to.get("/api/call", (ctx) => {
      return {
        message: "HTTP mock responses are working if you can read this.",
      };
    });
  }
}

class TestStore extends Store {
  setup(ctx) {
    const http = ctx.useStore("http");

    const lifecycleRuns = [];

    ctx.beforeConnect(() => {
      lifecycleRuns.push({ name: "beforeConnect", timestamp: new Date() });
    });

    ctx.afterConnect(() => {
      lifecycleRuns.push({ name: "afterConnect", timestamp: new Date() });
    });

    ctx.beforeDisconnect(() => {
      lifecycleRuns.push({ name: "beforeDisconnect", timestamp: new Date() });
    });

    ctx.afterDisconnect(() => {
      lifecycleRuns.push({ name: "afterDisconnect", timestamp: new Date() });
    });

    return {
      get isConnected() {
        return ctx.isConnected;
      },
      lifecycleRuns,
      async makeAPICall() {
        return http.get("/api/call").then((res) => res.body);
      },
      value: ctx.inputs.get("initialValue"),
    };
  }
}

test("basics", async () => {
  const { exports, teardown } = await wrapStore(TestStore, {
    stores: [{ store: "http", exports: TestHTTP }],
    inputs: { initialValue: 5 },
  });

  // expect(exports.isConnected).toBe(true);
  expect(exports.lifecycleRuns.length).toBe(2);
  expect(exports.value).toBe(5);

  // Run disconnect callbacks to clean up after testing.
  teardown();
});
