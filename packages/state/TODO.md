### Bound states

```js
const $person = makeState({
  firstName: "Dan",
  lastName: "Jones",
});

const $firstName = $person.bind("firstName");

$firstName.set("Bob");

$person.get(); // { firstName: "Bob", lastName: "Jones" }
```
