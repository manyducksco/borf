## PerSecondQueue

Like BatchQueue, but will only run X promises per second.

```ts
const queue = new PerSecondQueue(5, async (id) => {
  // Allows no more than five promises to start per second.
});
```
