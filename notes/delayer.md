```js
const d = new Delayer(500);

d.delay(() => {
  // call after 500ms (default)
});
d.delay(900, () => {
  // call after 900ms (override)
});

d.trigger(); // call immediately (if queued) and clear
d.cancel(); // cancel queued (if any) and clear
```
