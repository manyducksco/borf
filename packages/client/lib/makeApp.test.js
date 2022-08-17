import { createMemoryHistory } from "history";
import { makeApp } from "./makeApp.js";
import { makeService } from "./makeService.js";

test("lifecycle methods", async () => {
  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
    services: {
      http: {}, // Override http, otherwise window.fetch isn't defined in the test so this fails.
    },
  });
  const root = document.createElement("div");

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
    const { two } = ctx.services;

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
    services: {
      http: {}, // Override http, otherwise window.fetch isn't defined in the test so this fails.
      one,
      two,
    },
  });
  const root = document.createElement("div");

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
        return ctx.services.two.value + this.value;
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
    services: {
      http: {}, // Override http, otherwise window.fetch isn't defined in the test so this fails.
      one,
      two,
    },
  });
  const root = document.createElement("div");

  app.route("*", function () {
    expect(this.services.one.total).toBe(3);

    return null;
  });

  await app.connect(root);
});
