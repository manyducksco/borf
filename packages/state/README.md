# @woofjs/state

> These functions are also exported from `@woofjs/client` and `@woofjs/server`. Only use this package if you need a standalone version. Consider one of those two packages if you're making an app.

```
$ npm i --dev @woofjs/state
```

## The Basics

```js
import { makeState } from "@woofjs/state";

const $count = makeState(5);
```

We now have a state with a value of 5. The `$name` convention helps to clearly mark this as a state. That's not required, but it is recommended.

You can get and set the value of `$count` through the `get` and `set` methods.

```js
$count.get(); // returns 5
$count.set(10); // value of $count is now 10
$count.get(); // returns 10
```

The `watch` method takes a function and calls it each time the value changes, passing the new value. It returns a function that cancels the watcher.

```js
const unwatch = $count.watch((value) => {
  console.log(value); // Prints the value each time $count is set
});

unwatch(); // Stop watching
```

The `map` function creates a second state based on the first by running it through a function. Original value goes in, modified value comes out. Modified value stored in a second state. When the original state changes, the mapped state follows.

```js
const $doubled = $count.map((n) => n * 2);

$doubled.get(); // $count is 10, so $doubled returns 20

// There is no $doubled.set() since $doubled gets its value from $count.
// Setting the original state updates mapped states:
$count.set(7);

$count.get(); // now returns 7
$doubled.get(); // now returns 14
```

_Mapped states can themselves be mapped._ Mapped states support everything a normal state does except for `set`.

## Click Counter Example

Everyone loves a good click counter. Useless in real life but great for showing how a state library works.

### makeState + HTML

A basic example with `makeState` and typical browser stuff.

```html
<main>
  <p>Clicked <span id="label">0</span> time(s).</p>
  <br />
  <button id="increment">+1</button>
  <button id="decrement">-1</button>
</main>

<script type="module">
  import { makeState } from "https://cdn.skypack.dev/@woofjs/state";

  const label = document.getElementById("label");
  const increment = document.getElementById("increment");
  const decrement = document.getElementById("decrement");

  const $count = makeState(0);

  $count.watch((value) => {
    label.textContent = value.toString();
  });

  increment.addEventListener("click", () => {
    $count.set((current) => current + 1);
  });

  decrement.addEventListener("click", () => {
    $count.set((current) => current - 1);
  });
</script>
```

> NOTE: If you paste the above snippet into an HTML file and open it in your browser, it should just work. Here it is on CodePen: https://codepen.io/schwingbat/pen/NWwpvLy

### Woof + JSX

A state is useful on its own, but its day job is to be the backbone of reactivity in a framework called Woof. This is what the same example looks like in Woof.

We have basically copied that `<main>` block into a chunk of JavaScript and removed most of the code for binding data and events.

`$.text()` renders the current value of `$count` into the DOM as text. Event handler functions are passed directly to the buttons.

```js
import { makeComponent, makeState } from "@woofjs/app";

const Counter = makeComponent(($) => {
  const $count = makeState(0);

  return (
    <main>
      <p>Clicked {$.text($count)} time(s).</p>
      <br />
      <button onclick={() => $count.set((current) => current + 1)}>+1</button>
      <button onclick={() => $count.set((current) => current - 1)}>-1</button>
    </main>
  );

  // Or without JSX:
  return $("main", [
    $("p", ["Clicked ", $.text($count), " time(s)."]),
    $("br"),
    $("button", { onclick: () => $count.set((current) => current + 1) }, "+1"),
    $("button", { onclick: () => $count.set((current) => current - 1) }, "-1"),
  ]);
});
```

That `time(s)` label is kind of basic. To overcomplicate things, let's add a dynamic label based on the value of `$count`.

Now our label reads:

- Clicked 0 times.
- Clicked 1 time.
- Clicked 2 times.
- ...

```js
import { makeComponent, makeState } from "@woofjs/app";

const Counter = makeComponent(($) => {
  const $count = makeState(0);

  const $times = $count.map((current) => {
    if (current === 1) {
      return "time";
    } else {
      return "times";
    }
  });

  return (
    <main>
      <p>
        Clicked {$.text($count)} {$.text($times)}.
      </p>
      <br />
      <button onclick={() => $count.set((current) => current + 1)}>+1</button>
      <button onclick={() => $count.set((current) => current - 1)}>-1</button>
    </main>
  );
});
```

[Read more about Woof...]()

## API

### `makeState`

```js
import { makeState } from "@woofjs/state";

const $state = makeState("🤷‍♂️");
```

Here are all the functions you'll find on a state and how to call them:

- `.get` for getting the current value
  - `.get()` to get the current value
  - `.get("some.key")` to get a nested part of the current value &ndash; works when the value is an object
  - `.get(current => value)` to derive a new state from this state's `current` value and return it
- `.set` for updating the current value
  - `.set(newValue)` to set a new value
  - `.set(current => newValue)` to replace the current value by returning a new one
  - `.set(current => {})` to update the current value by mutating it ([produces a new value behind the scenes](https://immerjs.github.io/immer/))
- `.map` for deriving new states from this state
  - `.map()` to create a read-only copy of this state
  - `.map(current => newValue)` to make a state with `newValue` from this state's `current` value
  - `.map("some.key")` to make a new state out of a nested part of this state's value &ndash; equivalent to `.map(current => current.some.key)`
  - `.map("some.key", selected => newValue))` to make a new state out of a nested part of this state's value, as returned from a mapping function
- `.watch` for observing changes to this state
  - `.watch(current => {})` to watch for new values whenever the state is set &ndash; returns an `unwatch()` function
  - `.watch("some.key", selected => {})` to watch for changes to a nested part of the state's value &ndash; returns an `unwatch()` function
  - one of the following...
    - `.watch(current => {}, options)`
    - `.watch("some.key", selected => {}, options)`
    - ...where `options` is an object with these properties
      - `.immediate` (boolean) if true, call the watch function once with the current value
- `.toString()` to get the current value as a string

A state produced by `.map()` supports everything aside from `.set()` (because mapped states derive their values from the original state).

[See test suite for code examples](./makeState.test.js)<br>
[See implementation](./makeState.js)

#### Selectors

Selectors are keys for accessing nested properties on objects and arrays stored in a State. Nested keys are separated by `.` and `[]`s are used to access array items by index. An `[*]` index turns the result into an array by running the rest of the selector on each item.

```js
$state.get("width"); // Get the `width` property
$state.get("users[7].name.last"); // Get the last name of the 8th (from 0) user in an array called `users`
$state.get("[*].id"); // Get an array of all `id` values for each object in an array
```

### `mergeStates`

Takes two or more states followed by a merge function. This function receives the values of each state in the order they were passed and returns a value for a new state. This function is run each time any of the states changes.

It's a lot like `.map`, but for transforming multiple states into one.

```js
import { mergeStates } from "@woofjs/state";

const $isLoading = makeState(true);
const $hasData = makeState(false);

const $isReady = mergeStates($isLoading, $hasData, (isLoading, hasData) => {
  return hasData && !isLoading;
});
```

[See test suite for code examples](./mergeStates.test.js)<br>
[See implementation](./mergeStates.js)

---

[🦆](https://www.manyducks.co)
