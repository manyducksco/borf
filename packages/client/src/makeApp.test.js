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

  app.service("@http", () => {
    return {}; // Override @http, otherwise window.fetch isn't defined in the test so this fails.
  });
  app.service("@router", (self) => {
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

test.skip("lifecycle", () => {
  // beforeConnect and afterConnect are run
  // app waits for beforeConnect promise to resolve before connecting
});
