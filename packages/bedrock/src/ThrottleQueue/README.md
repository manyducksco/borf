## ThrottleQueue

Like BatchQueue, but will only run up to X promises per second.

```ts
const queue = new ThrottleQueue(5, async (id) => {
  // Allows no more than five promises to start per second.
});
```
