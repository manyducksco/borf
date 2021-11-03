```js
const cache = new Cache({
  store: new LocalStore("unique-id"),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```
