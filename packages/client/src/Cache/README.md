```js
const cache = new Cache({
  store: new LocalStore("unique-id"),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

const someValue = await cache.get("someKey");
await cache.set("someKey", 5);
await cache.clear("someKey");
```
