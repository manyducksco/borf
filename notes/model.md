# Models

Ensure integrity of JS objects and variables at runtime. Also bind to forms for easy validation.

```js
const User = makeModel((ctx) => {
  ctx.strict = true; // not strict by default because you should explicitly know to handle errors if it's on.

  return ctx.object({
    name: ctx.object({
      first: ctx.string().notEmpty(),
      last: ctx.string().notEmpty().optional(),
    }),
    email: ctx.string().email(),
  });
});

const user = User.make({
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
    {ctx.repeat(user.$errors, ($err) => (
      <li>{$err.as((e) => e.message)}</li>
    ))}
  </ul>
  <input
    type="text"
    value={user.writable("name.first")}
    invalid={user.to(() => !user.isValid("name.first"))}
  />
  <input
    type="text"
    value={user.bind("name.last")}
    invalid={user.map(() => !user.isValid("name.last"))}
  />
  <button>Submit</button>
</form>;
```
