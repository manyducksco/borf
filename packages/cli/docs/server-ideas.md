# Server API ideas

Encourage resource-based routing with Resource objects?

Advantage of using @route decorator is that the functions are still just functions, so they can be called normally for unit testing.

Can we do nested resources by passing params along?
users -> messages(users.id) -> message.author -> users.get(id)

In the above example, the Users resource somehow invoked the Messages resource and passed the user's ID. The messages resource can also be accessed independently.

```js
import { Server, Resource, route } from "@manyducksco/woof/server";

class Users extends Resource {
  @route("GET") // no route is passed, so this is the root (v1/users)
  async list(ctx) {
    if (!ctx.state.isAdmin) {
      ctx.status = 403;
      ctx.body = {
        message: "You must be an admin to view users.",
      };
      return;
    }

    const users = await this.service("db").query("users");
    ctx.body = {
      users,
    };
  }

  // If this function crashes the server will return a 500.
  // If a verbose errors option is enabled on the server, error details will be included.
  @route("GET", ":id") // :id is passed, so this is accessed at v1/users/:id
  async get(ctx) {
    const user = await this.service("db")
      .query("users")
      .where("id", ctx.params.id);

    if (user) {
      ctx.status = 200;
      ctx.body = {
        name: "Dude",
        salary: 120000,
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        message: "User not found",
      };
    }
  }

  @route("GET", ":id/messages") // v1/users/:id/messages
  async getMessages(ctx) {
    const user = await this.service("db")
      .query("users")
      .where("id", ctx.params.id);

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: "User not found",
      };
    } else {
      const messages = await this.service("db")
        .query("messages")
        .where("userId", ctx.params.id);

      ctx.body = {
        messages,
      };
    }
  }
}

const server = new Server();

// Register a resource at a route. The resource handles any further routing after this point.
server.route("v1/users", Users);

// Pass a middleware function. The next middleware or resource is loaded when 'next' is called.
server.route(
  "v1/users",
  (ctx, next) => {
    if (ctx.state.loggedIn) {
      next();
    } else {
      ctx.redirect("some/other/route");
    }
  },
  Users
);
```
