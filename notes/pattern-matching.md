```js
// Run against a value:
const checked = match(
  [[1, "once"], [2, "twice"], [3, "thrice"], (value) => `${value} times`],
  someValue
);

// Create matcher function with a pattern only:
const ordinal = match([
  [1, "once"],
  [2, "twice"],
  [3, "thrice"],
  (value) => `${value} times`,
]);

ordinal(5); // "5 times"
ordinal(2); // "twice"

// Pattern can be as simple as a literal:
const isFive = match(5);

const fizzify = match([
  [(n) => n % 15 === 0, "fizzbuzz"],
  [(n) => n % 3 === 0, "fizz"],
  [(n) => n % 5 === 0, "buzz"],
  // Fallback returns the value as a string:
  (n) => n.toString(),
]);

for (let i = 0; i < 100; i++) {
  fizzify(i);
}

function dividesBy(n) {
  return (num) => num % n === 0;
}

function range(start, end) {
  let numbers = [];

  for (let i = start; i < end; i++) {
    numbers.push(i);
  }

  return numbers;
}

function print(value) {
  return () => {
    console.log(value);
  };
}

const fizzify = match([
  [dividesBy(15), "fizzbuzz"],
  [dividesBy(3), "fizz"],
  [dividesBy(5), "buzz"],
  (n) => n.toString(),
]);

range(0, 100).forEach(print(fizzify));

range(0, 100).forEach(
  print(
    match([
      [dividesBy(15), "fizzbuzz"],
      [dividesBy(3), "fizz"],
      [dividesBy(5), "buzz"],
      (n) => n.toString(),
    ])
  )
);

// String matching
const check = match(contains("substring"));

check("this is substring"); // true
check("wowowow"); // false

for (let i = 0; i < 100; i++) {
  fizzify(i);
}

// One big convenience feature is that this works as a drop-in for JS .filter and .map
const evenOnly = range(0, 100).filter(match(dividesBy(2)));

// This is pretty composable:
const even = dividesBy(2);
const negate = (n) => n * -1;
const negativeEvens = range(0, 100).map(match([even, negate], pass));

// Pattern matching library:
import { when, contains, dividesBy, not, pass, even, odd } from "pataan";

// Basic conditions
const pass = (x) => x;
const string = (x) => typeof x === "string";
const object = (x) => x != null && typeof x === "object" && !array(x);
const defined = (x) => x !== undefined;
const longerThan = (x) => x && x.length > x;
const shorterThan = (x) => x && x.length < x;
const number = (x) => typeof x === "number" && !isNaN(x);
const array = (x) => Array.isArray(x);
const integer = (x) => dividesBy(1);
const float = (x) => !dividesBy(1);
const iterable = (x) => x != null && typeof x[Symbol.iterator] === "function";
const even = (x) => dividesBy(2);
const odd = (x) => combine(number, not(even));
const truthy = (x) => !!x;
const falsy = (x) => !x;

const assert = (pattern, value) => {
  const fn = (value) => {
    if (!matches(pattern, value)) {
      throw new TypeError(`Assertion failed: ${value}`);
    }
  };

  if (value) {
    return fn(value);
  } else {
    return fn;
  }
};

// Meta conditions (takes another condition and returns a basic condition)
const has = (key) => (x) => (object(x) && x[key]) || (array(x) && some(key));
const dividesBy = (d) => (x) => number(x) && x % d === 0;
const not = (pattern) => (x) => !matches(pattern, x);
const matches = (pattern, x) => {
  if (func(pattern)) {
    return truthy(pattern(x));
  }

  if (object(pattern) || array(pattern)) {
    // TODO: Deep equal
    return false;
  }

  return x === pattern;
};
const first = (pattern) => (x) => array(x) && matches(pattern, x[0]);
const last = (pattern) => (x) => array(x) && matches(pattern, x[x.length - 1]);
const contains = when([
  [object, has],
  [array, has],
  [string, (p) => (s) => s.indexOf(p) > -1],
]);

const combine =
  (...conds) =>
  (x) => {
    for (const cond of conds) {
      if (!cond(x)) {
        return false;
      }
    }
  };

const all = (pattern) => (x) => {
  if (!array(x)) return false;

  for (const item of x) {
    if (!matches(pattern, x)) {
      return false;
    }
  }

  return true;
};
const any = (pattern) => (x) => {
  if (!array(x)) return false;

  for (const item of x) {
    if (matches(pattern, x)) {
      return true;
    }
  }

  return false;
};
const none = not(any);

// true when array has all even numbers
match(all(even));
match(none(not(even)));

const when = (pattern, value) => {
  const fn = (value) => {
    if (array(pattern)) {
      const fallback = match(last(not(array)), pattern) && pattern.pop();
      for (const entry of pattern) {
        if (matches(entry[0], value)) {
          if (func(entry[1])) {
            return entry[1](value);
          }
          return value;
        }
      }
      if (fallback) {
        if (func(fallback)) {
          return fallback(value);
        }
        return fallback;
      }
    } else {
      return matches(pattern, value);
    }
  };

  if (value) {
    return fn(value);
  } else {
    return fn;
  }
};

match([[even, negate], pass]);

// The many faces of `contains`:
match(something, [
  [contains({ name: 1 }), "object where 'name' is 1"],
  [contains("sub"), "string with 'sub' in it"],
  [contains(5), "array with 5 in it"],
  [not(contains("fish")), "a non-fishy string"],
]);

assert(number, arg);

// Pattern matching an object:
const result = match(
  [
    // Deep equality test:
    [{ name: 1 }, "literally is { name: 1 }"],
    // Or literal equality:
    ["some-value", 'literally is "some-value"'],
    // Partial equality test:
    [contains({ name: 1 }), "name is 1 (and may have other properties)"],
    // Function test. Matches if returns true:
    [(v) => v.name === 2, "name is 2 (and may have other properties)"],

    // Function value. Takes the value being matched and returns the resulting value.
    ["some-value", (value) => value.toUpperCase()],
  ],
  someValue
);

const nameIsOne = match(includes({ name: 1 }));

const isTrue = nameIsOne({ age: 3741, name: 1 }); // isTrue === true
```
