import { createMemoryHistory } from "history";
import { h } from "./h.js";
import { makeApp } from "./makeApp.js";

test("nested routes are parsed correctly", async () => {
  const app = makeApp();
  const root = document.createElement("div");

  function AppLayout() {
    return h("div", this.children);
  }

  function UserLayout() {
    return h("div", this.children);
  }

  function Login() {
    return h("div");
  }

  function Logout() {
    return h("div");
  }

  function UserList() {
    return h("div");
  }

  function UserEdit() {
    return h("div");
  }

  app.service("http", () => {
    return {}; // Override http, otherwise window.fetch isn't defined in the test so this fails.
  });
  app.service("router", (self) => {
    const { routes } = self.options;

    expect(routes).toStrictEqual([
      {
        path: "/login",
        layers: [{ id: 0, component: Login }],
      },
      {
        path: "/logout",
        layers: [{ id: 1, component: Logout }],
      },
      {
        path: "users",
        layers: [
          { id: 2, component: AppLayout },
          { id: 3, component: UserLayout },
          { id: 4, component: UserList },
        ],
      },
      {
        path: "users/:userId/edit",
        layers: [
          { id: 2, component: AppLayout },
          { id: 3, component: UserLayout },
          { id: 5, component: UserEdit },
        ],
      },
      {
        path: "users/*",
        redirect: "/users",
      },
      {
        path: "/somewhere/*",
        redirect: "/users",
      },
    ]);

    return {};
  });

  app.route("/login", Login);
  app.route("/logout", Logout);
  app.route("/*", AppLayout, function () {
    this.route("/users", UserLayout, function () {
      this.route("/", UserList);
      this.route("/:userId/edit", UserEdit);
      this.redirect("*", "./");
    });
  });
  app.redirect("/somewhere/*", "/users");

  await app.connect(root);
});

test("lifecycle methods", async () => {
  const app = makeApp();
  const root = document.createElement("div");

  app.service("http", () => {
    return {}; // Override http, otherwise window.fetch isn't defined in the test so this fails.
  });

  const beforeConnect = jest.fn();
  const afterConnect = jest.fn();

  app.beforeConnect(beforeConnect);
  app.afterConnect(afterConnect);

  await app.connect(root);

  expect(beforeConnect).toHaveBeenCalledTimes(1);
  expect(afterConnect).toHaveBeenCalledTimes(1);
});

test("throws helpful error when accessing services that haven't been created yet from other services", () => {
  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.service("http", () => {
    return {}; // Override http, otherwise window.fetch isn't defined in the test so this fails.
  });

  app.service("one", (ctx) => {
    const { two } = ctx.services;

    return {
      value: 1,
      total: two.value + 1,
    };
  });

  app.service("two", () => {
    return {
      value: 2,
    };
  });

  expect(app.connect(root)).rejects.toThrow(
    "Service 'two' was accessed before it was initialized. Make sure 'two' is registered before other services that access it."
  );
});

test("error doesn't occur if accessing outside of the main function scope", async () => {
  const app = makeApp({
    router: {
      history: createMemoryHistory(),
    },
  });
  const root = document.createElement("div");

  app.service("http", () => {
    return {}; // Override http, otherwise window.fetch isn't defined in the test so this fails.
  });

  app.service("one", (ctx) => {
    return {
      value: 1,

      // Two is accessible because this function is not called until after it is initialized.
      get total() {
        return ctx.services.two.value + this.value;
      },
    };
  });

  app.service("two", () => {
    return {
      value: 2,
    };
  });

  app.route("*", function () {
    expect(this.services.one.total).toBe(3);

    return null;
  });

  await app.connect(root);
});
