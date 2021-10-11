# Store

Store is a data management and caching layer to handle an app's backing data and sync it to a server. It works along the lines of Backbone or Ember Data.

```js
import { PostModel, CommentModel } from "./models";

// fetching logic is implemented in an adapter class.
class APIAdapter extends Adapter {
  // fetch data and return single object
  async query(store, modelName, id) {
    return fetch(`/api/${modelName}/${id}`).then((res) => res.json()); // GET /api/post/1 or /api/comment/52
  }

  // fetch data and return array of objects
  async queryAll(store, modelName) {
    return fetch(`/api/${modelName}s`).then((res) => res.json()); // GET /api/posts or /api/comments
  }

  // create a new record through the API and return the newly created record data
  async create(store, modelName, record) {
    return fetch(`/api/${modelName}s`, {
      method: "post",
      body: JSON.stringify(record),
    }).then((res) => res.json());
  }

  // modify an existing record through the API
  async update(store, modelName, record) {
    return fetch(`/api/${modelName}/${record.id}`, {
      method: "put",
      body: JSON.stringify(record),
    });
  }

  // delete a record through the API
  async delete(store, modelName, record) {
    return fetch(`/api/${modelName}/${record.id}`, {
      method: "delete",
    });
  }
}

const store = new Store({
  // init the store with the APIAdapter defined above
  // you can also override adapter on the model, which will take precedence over the store's adapter
  adapter: APIAdapter,
});

store.addModel("post", PostModel);
store.addModel("comment", CommentModel);

const posts = await store.queryAll("post"); // get all posts (paging?)

for await (const post of posts) {
  // Async iterator will automatically handle paging as you go through the list
}

// get a PostModel instance for the post with ID 15
const post = await store.query("post", 15);

// Gets the record if already cached but doesn't actually fetch it
const post = store.peek("post", 15);

// Models implement State, so you can subscribe to changes, create bindings or map values.
post.subscribe("title", (value) => {
  console.log("post title changed to " + value);
});
const binding = post.bind("title");
const allCapsTitle = post.map("title", (title) => title.toUpperCase());

// you can use the standard set function
post.set("title", "New Title");

// setters are generated for each property too
// this does the same as the set function including triggering subscribers
post.title = "New Title";

post.isChanged; // true if changes have been made since data was fetched (always true for new items not saved yet)
post.isValid; // always true unless model's 'validate' function is defined and has returned an error
post.validationError; // string explaining issues with validation (as returned by model 'validate')
await post.save(); // persist data (probably to an API) (resets undo history)
await post.delete(); // mark as deleted but persist later with .save()
await post.destroy(); // mark as deleted and persist now
await post.refresh(); // fetch new data from the server and replace the local data (resets undo history)

// Create a new record
const post = store.create("post", {
  title: "initial title",
});

await post.save(); // persist new record
// this will require the code behind saving to get the new item's ID from the backend and refresh data

// The store itself also has some methods for working with models
await store.saveAll("post"); // saves all unsaved changes on all post records
await store.invalidate("post", 5); // invalidates cache data for post with ID 5
await store.invalidateAll("post"); // invalidates cache data for all post records
```

React adapter:

```js
import { PostModel, CommentModel } from "./models";

const store = new Store();

store.addModel("post", PostModel);
store.addModel("comment", CommentModel);

// Provide store in app somewhere and all components below can use the hooks
<StoreProvider store={store}>
  <ExampleComponent />
</StoreProvider>;

function ExampleComponent() {
  const store = useStore();
  const { isLoading, isSuccess, isError, record, error } = useQuery("post", 5); // or useQueryAll("post") and 'records' will contain an array

  record.set("title", "new value"); // causes re-render
  record.save();

  store.refresh("post", 5);
  store.refreshAll("post");
}
```
