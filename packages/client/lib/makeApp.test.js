import { createMemoryHistory } from "history";
import { makeApp } from "./makeApp.js";
import { makeService } from "./makeService.js";

test("lifecycle methods", async () => {
  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.service("http", {}); // Override http, otherwise window.fetch isn't defined in the test so this fails.

  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();

  app.beforeConnect(beforeConnect);
  app.afterConnect(afterConnect);

  await app.connect(root);

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
});

test("throws helpful error when accessing services that haven't been created yet from other services", () => {
  const one = makeService((ctx) => {
    const two = ctx.getService("two");

    return {
      value: 1,
      total: two.value + 1,
    };
  });

  const two = makeService((ctx) => {
    return {
      value: 2,
    };
  });

  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.service("http", {}); // Override http, otherwise window.fetch isn't defined in the test so this fails.
  app.service("one", one);
  app.service("two", two);

  expect(app.connect(root)).rejects.toThrow(
    "Service 'two' was accessed before it was initialized. Make sure 'two' is registered before other services that access it."
  );
});

test("error doesn't occur if accessing outside of the main function scope", async () => {
  const one = makeService((ctx) => {
    return {
      value: 1,

      // Two is accessible because this function is not called until after it is initialized.
      get total() {
        return ctx.getService("two").value + this.value;
      },
    };
  });

  const two = makeService(() => {
    return {
      value: 2,
    };
  });

  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.service("http", {}); // Override http, otherwise window.fetch isn't defined in the test so this fails.
  app.service("one", one);
  app.service("two", two);

  app.route("*", function (ctx) {
    expect(ctx.getService("one").total).toBe(3);

    return null;
  });

  await app.connect(root);
});
