import { createMemoryHistory } from "history";
import { App } from "../App.js";

test("lifecycle methods", async () => {
  const app = new App({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.global("http", () => ({})); // Override http, otherwise window.fetch isn't defined in the test so this fails.

  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();

  app.beforeConnect(beforeConnect);
  app.afterConnect(afterConnect);

  await app.connect(root);

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
});

test("throws helpful error when accessing globals that haven't been created yet from other globals", () => {
  const one = function (ctx) {
    const two = ctx.global("two");

    return {
      value: 1,
      total: two.value + 1,
    };
  };

  const two = function (ctx) {
    return {
      value: 2,
    };
  };

  const app = new App({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.global("http", () => ({})); // Override http, otherwise window.fetch isn't defined in the test so this fails.
  app.global("one", one);
  app.global("two", two);

  expect(app.connect(root)).rejects.toThrow(
    "Global 'two' was accessed before it was initialized. Make sure 'two' is registered before other globals that access it."
  );
});

test("error doesn't occur if accessing outside of the main function scope", async () => {
  const one = function (ctx) {
    return {
      value: 1,

      // Two is accessible because this function is not called until after it is initialized.
      get total() {
        return ctx.global("two").value + this.value;
      },
    };
  };

  const two = function () {
    return {
      value: 2,
    };
  };

  const app = new App({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.global("http", () => ({})); // Override http, otherwise window.fetch isn't defined in the test so this fails.
  app.global("one", one);
  app.global("two", two);

  app.route("*", function (ctx) {
    expect(ctx.global("one").total).toBe(3);

    return null;
  });

  await app.connect(root);
});
