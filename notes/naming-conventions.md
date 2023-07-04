# Readable and Writables

I'm kind of rethinking whether I like the `$` and `$$` prefix convention right now. It makes typing variable names kind of awkward and leads to a ridiculous amount of `$`s in your templates, especially if using tagged template literals. It's kind of the only special character that isn't reserved in JS, so it gets overloaded as shit. It might be the best option though.

## Possible Alternatives

Here's everything I can think of, no matter how stupid.

### (Current)

```js
// $$name for Writables
const $$number = new Writable(5);

// $name for Readables
const $doubled = $$number.map((n) => n * 2);

ctx.observe($doubled, (value) => {
  ctx.log("doubled:", value);
});

// As used in the framework:
const router = ctx.getStore("router");

ctx.log(router.$route.value);

router.$$query.update((current) => {
  current.someValue = 5;
});

function ExampleView(attrs, ctx) {
  const $$title = Writable.from(attrs.title ?? "Default Title");

  // value=${$$title} is not nice
  return html`<input type="text" value=${$$title} />`;
}
```

### Hungarian Notation

```js
// wName for Writables
const wNumber = new Writable(5);

// rName for Readables
const rDoubled = wNumber.map((n) => n * 2);

ctx.observe(rDoubled, (value) => {
  ctx.log("doubled:", value);
});

// As used in the framework:
const router = ctx.getStore("router");

ctx.log(router.rRoute.value);

router.wQuery.update((current) => {
  current.someValue = 5;
});

function ExampleView(attrs, ctx) {
  // attrs.title must be undefined or a Writable
  const wTitle = Writable.from(attrs.title ?? "Default Title");

  // automatic two-way binding to `title` because it's a Writable
  return html`<input type="text" value=${wTitle} />`;
}
```

### Underscores

This is a bad idea because it makes everything look private.

```js
const __number = new Writable(5);
const _doubled = __number.map((n) => n * 2);

ctx.observe(_doubled, (value) => {
  ctx.log("doubled:", value);
});

const router = ctx.getStore("router");

ctx.log(router._route.value);

router.__query.update((current) => {
  current.someValue = 5;
});

function ExampleView(attrs, ctx) {
  // attrs.title must be undefined or a Writable
  const __title = Writable.from(attrs.title ?? "Default Title");

  // automatic two-way binding to `title` because it's a Writable
  return html`<input type="text" value=${__title} />`;
}
```

### Dollar Sign Postfix

Let autocomplete deal with the symbols, but keep the utility of the naming convention.

```js
// name$$ for Writables
const number$$ = new Writable(5);

// name$ for Readables
const doubled$ = number$$.map((n) => n * 2);

ctx.observe(doubled$, (value) => {
  ctx.log("doubled:", value);
});

// As used in the framework:
const router = ctx.getStore("router");

ctx.log(router.route$.value);

router.query$$.update((current) => {
  current.someValue = 5;
});

function ExampleView(attrs, ctx) {
  // attrs.title must be undefined or a Writable
  const title$$ = Writable.from(attrs.title$$ ?? "Default Title");

  // automatic two-way binding to `title` because it's a Writable
  return html`<input type="text" value=${title$$} />`;
}
```

### None

Just don't have a naming convention. This will work for TypeScript, but doesn't indicate anything useful at a glance. You'll just have to remember what kind of container it is or refer back to the definition.

```js
const number = new Writable(5);
const doubled = number.map((n) => n * 2);

ctx.observe(doubled, (value) => {
  ctx.log("doubled:", value);
});

const router = ctx.getStore("router");

ctx.log(router.route.value);

router.query.update((current) => {
  current.someValue = 5;
});
```

This eliminates the awkwardness around naming component attributes when the types are flexible. You'll still get runtime errors if you pass the wrong types when using the component API to its fullest.

You also can't get the naming convention wrong and cause confusion (though this hasn't happened to me).

```js
function ExampleView(attrs, ctx) {
  // attrs.title must be undefined or a Writable
  const title = Writable.from(attrs.title ?? "Default Title");

  // automatic two-way binding to `title` because it's a Writable
  return html`<input type="text" value=${title} />`;
}
```

### Hungarian Postfix

Like hungarian, but the letter goes at the end.

```js
const numberW = new Writable(5);
const doubledR = number.map((n) => n * 2);

ctx.observe(doubledR, (value) => {
  ctx.log("doubled:", value);
});

const router = ctx.getStore("router");

ctx.log(router.routeR.value);

router.queryW.update((current) => {
  current.someValue = 5;
});
```

### Hungarian Underscored

Not very JS.

```js
const w_number = new Writable(5);
const r_doubled = w_number.map((n) => n * 2);

ctx.observe(r_doubled, (value) => {
  ctx.log("doubled:", value);
});

const router = ctx.getStore("router");

ctx.log(router.r_route.value);

router.w_query.update((current) => {
  current.someValue = 5;
});
```
