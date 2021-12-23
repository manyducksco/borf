# Server Notes

```js
import { Server } from "@woofjs/server";
import { Users } from "./resources/Users/Users.js";

const server = new Server();

// Automatically serve 'static' dir by default if it exists?

server.use((ctx, next) => {
  const timer = ctx.service("timing").start(ctx);

  await next(); // Awaiting next works like in Koa

  timer.end();
});

// Resources are mounted at a path and handle all requests starting with that path.
// Middleware can also be inserted between the path and resource.
server.resource("api/users", Users);

server.listen(4000);
```

Resources are classes that group related routes. Think of a Resource like a thing, and the routes as operations you can perform on the thing. The thing could be a User, and Article, a Comment, or any other object your app is concerned with.

```js
import { Resource } from "@woofjs/server";
import validate from "../middleware/validate";
import userModel from "../models/user";

export class Users extends Resource {
  // Define which methods map to which routes.
  // Routes here are relative to the route this resource was mounted on.
  _map(route) {
    route.get("/", this.getAll);
    route.get("/:id", this.getOne);

    // Pass middleware between the path and handler:
    route.put("/:id", validate(userModel), this.update);
  }

  async getAll(ctx) {
    const limit = ctx.query.limit || 50;
    const offset = (ctx.query.page || 0) * limit;

    // Returning value in route function will infer content-type (if not explicitly set) and set value as body.
    return this.service("db").query("users").limit(limit).offset(offset);
  }

  async getOne(ctx) {
    const user = await this.#findUser(ctx.params.id);

    if (user) {
      ctx.status = 200;
      ctx.body = user;
    } else {
      ctx.status = 404;
    }
  }

  async update(ctx) {
    const user = await this.#findUser(ctx.params.id);
  }

  async #findUser(id) {
    return this.service("db").query("users").where("id", id);
  }

  async contextStuff(ctx) {
    ctx.state; // object to store anything (auth, etc.)
    ctx.service("name"); // inject services
    ctx.request;
    ctx.response;
    ctx.req; // shorthand versions
    ctx.res;

    const { req, res } = ctx;

    req.method;
    req.url;
    req.headers;
    req.params; // get URL params
    req.query; // get query params

    // Set properties on res to customize response
    res.status = 200;
    res.body = "OK";
    res.headers["content-type"] = "application/json";
  }
}
```

If you have many routes and you want to separate them into different files, use a Router. Server extends Router, so has all of the same methods for defining routes.

```js
import { Router } from "@woofjs/server";
import { Thing } from "./resources/Thing/Thing.js";

const router = new Router();

router.resource("thing/*", Thing); // Resource is loaded when this route is matched?

router.get("/", () => {
  return "OK"; // Return a body
});

router.get("manual/json", (ctx) => {
  ctx.response.headers["content-type"] = "application/json";

  return JSON.stringify({
    message:
      "This is returned as string, but content-type is set to application/json",
  });
});

router.get("auto/json", (ctx) => {
  return {
    message:
      "This is returned as an object, so content-type is inferred as application/json",
  };
});

export default router;
```

```js
// How do nested routes take precendence? In the following scenario, if we match against
// local first followed by nested, then we will match against the :loose variant before
// trying the more specific match on the resource.

// All routes need to be passed to their parent and make their way up to the master list at server level.
// Sorting by specificity requires there to be a single list.
// Route callback would retain scope in the resource/router that created them.

// Also, any functions configured in _map need to be bound to the resource where they were defined
// to prevent issues with `this`.

router.get("/more/:loose/:id", (ctx) => {});

router.resource(
  "/more/*",
  class extends Resource {
    _map(route) {
      route.get("/specific/:id", this.getOne);
    }

    async getOne(ctx) {}
  }
);
```

Side note on resources; can we extract the class name for a heading when printing routes on CLI?

## Thought: Record storage with arbitrary backends?

Does it make sense to have a record-based object persistance layer that can be implemented against SQL, flat files, etc? Could be kind of like Active Record but abstracting out the DB.

```js
import { Record, Types, MemoryAdapter } from "@woofjs/data";

class User extends Record {
  // These would be picked up when defining the model, but replaced with an actual value once loaded.
  firstName: Types.string.required;
  lastName: Types.string.required;

  // _define(types) {
  //   return {
  //     firstName: types.string.required,
  //     lastName: types.string.required,
  //   };
  // }

  fullName() {
    return this.firstName + " " + this.lastName;
  }
}

// Then create a store with this record like so:
const store = MemoryAdapter.createStore({
  user: User
});

const user = await store.find("user", id);

user.firstName = "John";

console.log(user.fullName()); // "John Jones", etc.

await user.save(); // What this actually does depends on which storage adapter you're using. Could be JSON files, a SQL database, a remote API, etc.
```

It could be possible to use this on the frontend too. Could create an adapter to make HTTP calls for CRUD ops.

Other query methods:

```js
const user = await store.find("user", 5);
const user = await store.findWhere("user", { id: 5, firstName: "Ronald" });
const theDans = await store.findAllWhere("user", { firstName: "Dan" });

store.findAllWhere("user", { firstName: { $startsWith: "Da" } }); // Kind of Mongoey?

// Create a new record:
const user = new User({
  firstName: "Ted",
  lastName: "Danson",
});

await user.save();
```

Instance methods:

```js
await user.save();
await user.delete();
await user.refresh(); // get current data again from source, overwriting current data
```

Could just import and use the records directly if they have a global adapter set:

```js
import { Record, MemoryAdapter } from "@woofjs/data";
import { User } from "./records/User/User.js";

const adapter = new MemoryAdapter(); // Store records in memory only.

adapter.seed(User, [
  // seed adapter data for User record
  {
    id: 1,
    firstName: "John",
    lastName: "Jones",
  },
  {
    id: 2,
    firstName: "The",
    lastName: "Dude",
  },
]);

// This might be better as a store that has records registered under a name.
// Could be a service or just a standalone store.
app.service(
  "store",
  adapter.createStore({
    user: User,
  })
);

this.service("store").find("user", 5); // find a User with id of 5
```

Defining a custom adapter:

```js
import { Adapter } from "@woofjs/data";

export class HTTPAdapter extends Adapter {
  async find(recordClass, id) {
    // Record needs an endpoint = "/api/v1/users" or similar so adapter knows route
    recordClass.endpoint;
  }

  async findWhere(recordClass, options) {}

  async findAllWhere(recordClass, options) {}

  async saveRecord(recordClass, instance) {}

  async deleteRecord(recordClass, instance) {}
}
```

Possible to align with Resource so it just falls into place?

Possible adapters:

- MemoryAdapter
- HTTPAdapter
- IndexedDBAdapter
- LocalStorageAdapter
- SessionStorageAdapter

Could also implement a FakerAdapter using faker.js data for testing.

```js

```
