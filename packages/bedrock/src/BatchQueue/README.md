# BatchQueue

Manages a potentially infinite series of promises (one per item) as a queue, where you define how many promises can be pending at one time and a callback that takes the item and performs some async logic with it.

Items can be added to the queue as it's processing, but the limit guarantees no more than X items will be pending at once.

BatchQueue can be thought of as a more controlled Promise.all.

Use cases:

- Hitting an API with many requests while being mindful of rate limits.

```ts
const queue = new BatchQueue(10, async (id) => {
  const res = fetch(`/api/users/${id}`);
  return res.json();
});

queue.on("resolve", (item, result) => {
  // Called when the process callback resolves.
  console.log(`User ${id} is`, result);
});

queue.on("reject", (item, error) => {
  // Called when the process callback rejects.
});

queue.on("complete", () => {
  // All items in the queue have been processed.
});

queue.add(1);
queue.add(2);
queue.add(3);
```

## IDEA: TimedQueue

Like BatchQueue, but will only run X promises per second.

```ts
const queue = new TimedQueue(5, async (id) => {
  // Allows no more than five promises to start per second.
});
```
