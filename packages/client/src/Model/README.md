# Model

Define the shape of a state object owned by the server. Used with `Store` to manage a collection of API data.

```ts
type TaskAttrs = {
  title: string;
  description: string;
};

// define the model
class TaskModel extends Model<TaskAttrs> {
  static idAttribute = "taskId";

  static attributes = {
    title: "Default Title",
    description: "Default description",
  };

  validate(attrs) {}
}

// create a store
const store = new Store();

// register the model with a key
store.addModel("task", TaskModel);

// now you can query against the key to get instances of the model
await store.query("task", 5);
```
