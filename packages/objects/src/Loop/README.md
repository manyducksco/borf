# Loop

Helpers for iterating.

```ts
Loop.times(5, (n) => {
  console.log(`Loop number ${n}!`);
});

Loop.each(["one", "two", "three"], (item, index, stop) => {
  // Iterate through arrays.

  // Easily stop iterating from within the loop. This call to the callback will be the last call.
  stop();
});

Loop.each({ key1: "value1", key2: "value2" }, (key, value, stop) => {
  // Iterate through key/value pairs of objects.
});

// Iterables will be treated like arrays.
Loop.each(map.entries(), (item, index, stop) => {});

const results = await Loop.batchQueue(
  manyItems,
  10,
  async (item, index, stop) => {
    // Process all items in an iterable with an async function, as fast as possible, with no more than 10 promises pending at one time.
    // Starts new promises as old ones resolve, keeping the maximum amount of work pending simultaneously.
    // This can come in handy when you need to make a lot of API calls, for example, but you are being mindful of rate limits.
  }
);

await Loop.until(async (stop) => {
  return new Promise((resolve) => {
    const interval = setTimeout(() => {
      if (Math.random() > 0.8) {
        stop();
        resolve();
        clearInterval(interval);
        console.log("Goose");
      } else {
        console.log("Duck");
      }
    }, 2000);
  });
});

// Will be async if the callback is async.
await Loop.times(5, async () => {
  // Do async stuff five times.
});

// Reverse
Loop.timesReverse(/* etc */);
Loop.eachReverse(/* etc */);
Loop.batchQueueReverse(/* etc */);

// Create a game loop that runs with requestAnimationFrame
Loop.game((delta) => {
  render(delta);
}).start();
```
