# States

## Initialize

```js
import { makeState } from "@woofjs/client";

const $count = makeState(5);
```

We now have a state with a value of 5. The `$name` convention helps to clearly mark this as a state. That's not required, but it is recommended.

## Get and Set

You can get and set the value of `$count` through the `get` and `set` methods.

```js
$count.get(); // returns 5
$count.set(10); // value of $count is now 10
$count.get(); // returns 10
```

## Subscribe

The `subscribe` method allows you to observe changes to the state and react when they happen. State subscriptions are compatible with the [TC39 Observable proposal](https://github.com/tc39/proposal-observable).

```js
// Callback style.
const subscription = $count.subscribe((value) => {
  console.log(value);
});

// Object style. Only 'next' will ever be called because states can't complete or throw errors.
const subscription = $count.subscribe({
  next: (value) => {
    console.log(value);
  },
  // error: (e) => {},
  // complete: () => {}
});

subscription.unsubscribe();
```

## Map

The `map` function creates a second state based on the first by running it through a function. Original value goes in, modified value comes out. Modified value stored in a second state. When the original state changes, the mapped state follows.

```js
const $doubled = $count.map((n) => n * 2);

$doubled.get(); // returns 20 while $count is 10

$count.set(7); // When the original state's value changes, mapped states will follow

$count.get(); // now returns 7
$doubled.get(); // now returns 14
```

_Mapped states can themselves be mapped._ Mapped states support everything a normal state does except for `set`.

## Click Counter Example

Everyone loves a good click counter. Useless in real life but great for showing how state handling works.

```js
import { makeState } from "@woofjs/client";

function Counter() {
  const $count = makeState(0);

  function increment() {
    $count.set((current) => current + 1);
  }

  return (
    <main>
      <p>Clicked {$count} time(s).</p>
      <br />
      <button onclick={increment}>+1</button>
    </main>
  );
}
```

Our click count label is kind of basic. To overcomplicate things and to show off how you might use `.map()`, let's add a dynamic label based on the value of `$count`.

```js
import { State } from "@woofjs/client";

function Counter() {
  const $count = makeState(0);

  function increment() {
    $count.set((current) => current + 1);
  }

  const $label = $count.map((current) => {
    if (current === 0) {
      return "Not clicked.";
    } else if (current === 1) {
      return "Clicked once.";
    } else if (current === 2) {
      return "Clicked twice.";
    } else {
      return `Clicked ${current} times.`;
    }
  });

  return (
    <main>
      <p>{$label}</p>
      <br />
      <button onclick={increment}>+1</button>
    </main>
  );
}
```

Now our label reads:

- Not clicked.
- Clicked once.
- Clicked twice.
- Clicked 3 times.
- Clicked 4 times.
- ...

## API

### `State`

```js
import { State } from "@woofjs/state";

const $state = makeState("🤷‍♂️");
```

Here are all the functions you'll find on a state and how to call them:

- `.get` for getting the current value
  - `.get()` to get the current value
  - `.get(current => value)` to derive a makeState from this state's `current` value and return it
- `.set` for updating the current value
  - `.set(newValue)` to set a new value
  - `.set(current => newValue)` to replace the current value by returning a new one
  - `.set(current => {})` to update the current value by mutating it
- `.map` for deriving makeStates from this state
  - `.map()` to create a read-only copy of this state
  - `.map(current => newValue)` to make a state with `newValue` from this state's `current` value
- `.subscribe` for observing changes to this state
  - `.subscribe({ next: (value) => {} })` to watch for new values whenever the state is set &ndash; returns a subscription object with an `unsubscribe` method to stop receiving new values.
  - `.subscribe(value => {})` which is a shorthand for the above syntax

A state produced by `.map()` supports everything aside from `.set()` (because mapped states derive their values from the original state).

### `mergeStates`

Takes two or more states followed by a merge function. This function receives the values of each state in the order they were passed and returns a value for a makeState. This function is run each time any of the states changes.

It's a lot like `.map`, but for transforming multiple states into one.

```js
import { mergeStates } from "@woofjs/state";

const $isLoading = makeState(true);
const $hasData = makeState(false);

const $isReady = mergeStates($isLoading, $hasData, (isLoading, hasData) => {
  return hasData && !isLoading;
});
```

### `makeProxyState`

> TODO

### `makeStore`

> TODO

---

[🦆](https://www.manyducks.co)
