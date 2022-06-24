# Models

Ensure integrity of JS objects and variables at runtime. Also bind to forms for easy validation.

```js
const makeUser = makeModel((m, self) => {
  self.strict = true; // not strict by default because you should explicitly know to handle errors if it's on.

  return m.object({
    name: m.object({
      first: m.string().notEmpty(),
      last: m.string().notEmpty().optional(),
    }),
    email: m.string().email(),
  });
});

const user = makeUser({
  name: {
    first: "Tony",
    last: 5,
  },
  email: "tony@thatsalotofducks.com",
});
// throws Error("Expected a string for 'name.last'. Got: 5")

user.get("name.first");
user.set((current) => {
  // Throws error on set if validation doesn't pass
  current.email = "ffff";

  // Throws if undefined keys are added
  current.unknown = 2;
});

<form
  onsubmit={(e) => {
    e.preventDefault();

    if (user.isValid()) {
      // submit to API/service/etc.
    } else {
      // Don't do shit.
    }
  }}
>
  <ul>
    {repeat(user.$errors, (err) => (
      <li>{err.message}</li>
    ))}
  </ul>
  <input type="text" value={user.bind("name.first")} invalid={user.map(() => !user.isValid("name.first"))} />
  <input type="text" value={user.bind("name.last")} invalid={user.map(() => !user.isValid("name.last"))} />
  <button>Submit</button>
</form>;
```
