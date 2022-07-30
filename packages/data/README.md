# `@woofjs/data`

Data models, collections and validation for dogs. 🐕

## Terminology

- **Model**: A class that defines a data object in your app.
- **Schema**: An object that defines the shape of a Model's data.
- **Record**: An instance of a Model, or a plain JS object that fits the model's schema.
- **Collection**: A container for a group of records that all adhere to one Model. Provides methods for querying and modifying those records.

## Models

Define the structure of your objects with Models.

```js
import { makeModel } from "@woofjs/data";

const User = makeModel({
  key: "id",

  schema(v) {
    const datePattern = /\d{4}-\d{2}-\d{2}Z\d{2}:\d{2}\.\d{3}Z/;

    return v
      .object({
        id: v.number(),
        name: v.shape({
          family: v.string().optional(),
          given: v.string(),
          format: v.oneOf("family-given", "given-family").optional(),
        }),
        status: v.oneOf("offline", "online"),
        createdAt: v.string().pattern(datePattern),
      })
      .strict();
  },

  // Computed property; accessible on a model instance as `instance.fullName`, just like other model data.
  get fullName() {
    if (this.name.family == null) {
      return this.name.given;
    } else if (this.name.format === "family-given") {
      // Support family name first (e.g. Japanese, Korean names, etc.)
      return `${this.name.family} ${this.name.given}`;
    } else {
      // Support given name first (e.g. Western names)
      return `${this.name.given} ${this.name.family}`;
    }
  },
});
```

### Validating objects

Model classes can be used to validate plain objects to determine if the data in the objects matches the model schema.

```js
const data = {
  id: 1,
  name: "Bob Jones",
  createdAt: "yesterday",
};

const { valid, errors } = User.validate(data);
```

In this case `valid` would be false and `errors` would contain this:

```js
[
  {
    path: ["name"],
    message: "expected an object; received a string",
    received: "Bob Jones"
  },
  {
    path: ["status"],
    message: "expected one of: 'offline', 'online'; received undefined",
    received: undefined
  }
  {
    path: ["createdAt"],
    message: "string does not match expected pattern",
    received: "yesterday"
  },
];
```

### Subscribing to changes

Model instances are observables, meaning you can `.subscribe` to them to be notified of any changes.

```js
const user = new User(data);

const subscription = user.subscribe((latest) => {
  console.log("user data changed", latest);
});

user.name = "Jimothy Derbs"; // Observer receives the data with this new name.

// Stop receiving changes
subscription.unsubscribe();
```

## Collections

Maintain a collection of records belonging to the same model.

```js
import { collectionOf } from "@woofjs/data";

const Users = collectionOf(User);
```

### Adding and removing records

Collections have three methods to modify their collected records; `insert`, `remove` and `clear`.

```js
// A User instance.
const user = new User({
  id: 1,
  name: {
    family: "Jones",
    given: "Bob",
    format: "given-family",
  },
  status: "online",
  createdAt: new Date().toISOString(),
});

await Users.insert(user);

await Users.remove(user);

// Remove all records.
await Users.clear();
```

The `insert` and `remove` methods can take one or more objects, and `remove` can also take IDs.

```js
await Users.insert(user1, user2, user3);

await Users.remove(user1, 123, user3);
```

### Updating records

Model IDs in a collection are unique, so if you want to update an existing record you just `add` another object with the same ID.

```js
const
```

### Querying records

```js
// Returns the first record where the function returns true.
const user = await Users.find((user) => {
  return user.id === 123;
});

// Get one record by ID (shorthand).
const user = await Users.find(123);

// Get all records where the function returns true.
const onlineUsers = await Users.filter((user) => {
  return user.status === "online";
});
```

`find` and `filter` return observables, so if you want to subscribe to a live query instead of getting a value once, you can call `.subscribe` instead of using `.then` or `await`.

```js
const subscription = Users.filter((user) => user.status === "online").subscribe(
  (results) => {
    // Gets the filtered results whenever changes occur in the collection.
  }
);

const subscription = Users.find(123).subscribe((user) => {
  // Gets the latest result whenever user 123 is updated.
});

// Unsubscribe to stop receiving updates.
subscription.unsubscribe();
```

### Subscribing to collection changes

Collections emit events when their data changes. Each callback receives an array of the affected records.

```js
const cancel = Users.on("add", (users) => {
  // Do something with the new records.
});

const cancel = Posts.on("update", (users) => {
  // Do something with the updated records.
});

const cancel = Users.on("remove", (users) => {
  // Do something with the removed records.
});

// Cancel to stop listening for changes.
cancel();
```
