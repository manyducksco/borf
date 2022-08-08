# `@woofjs/data`

Data models, collections and validation for dogs. 🐕

Modern apps may have many sources of data, but you still need a single source of truth. In `@woofjs/data`, models ensure the truth that your data is what you expect it to be, while collections ensure that only one copy of a given record exists at once in that collection.

## Models

Models ensure that your data is structured how you expect by enforcing a schema that you define. Model instances (called 'records') are uniquely identified by the value of their `key`.

```js
import { makeModel, v } from "@woofjs/data";

const User = makeModel({
  key: "id",

  schema: v
    .object({
      id: v.number(),
      name: v.shape({
        family: v.string().optional(),
        given: v.string(),
        format: v.oneOf("family-given", "given-family").optional(),
      }),
      status: v.oneOf("offline", "online"),
      createdAt: v.string().isoDate(),
    })
    .strict(),
});
```

### Validating objects

Models can validate plain objects to determine if they match the model's schema.

```js
const data = {
  id: 1,
  name: "Bob Jones",
  createdAt: "yesterday",
};

const result = User.validate(data);

// result:
{
  key: undefined,
  valid: false,
  errors: [
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
  ]
}
```

### Subscribing to changes

Records are observable, meaning you can `.subscribe` to them to receive new values when the data they hold has changed.

```js
const user = new User(data);

const subscription = user.subscribe((latest) => {
  console.log(`Hello ${latest.name.given}!`);
});

user.name.given = "Jimothy"; // Observer receives the data with this new name.

// "Hello Jimothy!"

// Stop receiving changes
subscription.unsubscribe();
```

## Collections

Collections group records that conform to a model's schema. Records are identified by their `key`, so only one copy of a given record can exist in a collection at one time.

```js
import { collectionOf } from "@woofjs/data";

const Users = collectionOf(User);
```

### Adding and removing records

Collections have three methods to modify their collected records; `set`, `delete` and `clear`.

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

await Users.set(user);

await Users.delete(user);

// Remove all records.
await Users.clear();
```

The `set` and `delete` methods can take one or more objects, and `delete` can also take IDs.

```js
await Users.set(user1, user2, user3);

await Users.delete(user1, 123, user3);
```

### Updating records

Model IDs in a collection are unique, so if you want to update an existing record you just `set` another object with the same ID.

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

`find` and `filter` return observables, so if you want to subscribe to a live query instead of getting a value only once, you can call `.subscribe`.

```js
const subscription = Users.filter((user) => user.status === "online").subscribe(
  (results) => {
    // Gets the list of online users whenever the collection changes.
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

const cancel = Users.on("delete", (users) => {
  // Do something with the removed records.
});

// Cancel to stop listening for changes.
cancel();
```

### Sorting collections

Collections can be sorted so their records always appear in a certain order when filtered or iterated through. The `sortBy` option can be a string, object or function. All three ways to define it are outlined below.

```js
const Users = collectionOf(User, {
  // Sort by 'createdAt' ascending
  sortBy: "createdAt",

  // Sort by 'createdAt' descending
  sortBy: {
    key: "createdAt",
    descending: true,
  },

  // Or pass a sort function directly that takes two records.
  sortBy: (a, b) => {
    return a.createdAt < b.createdAt ? -1 : 1;
  },
});
```
