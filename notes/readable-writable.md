# Readables, Writables and Observables

I've been trying to support the Observable standard, but it has features I don't think are relevant for Borf. Errors are thrown at the location they're caused, synchronously. States also never really "complete". The most streamlined API for that would be the following:

```js
const stop = $value.observe((value) => {
  // Do something with the value.
});

stop(); // Stop observing.
```

That would simplify things. Regular observables could be wrapped with some kind of readable adapter if desired.

```js
// $value holds the next(value) from someObservable:
const $value = Readable.from(someObservable, {
  onError: (err) => {
    // Do something with errors.
  },
  onComplete: () => {
    // Do something when observable completes.
  },
});
```

Also, possibly rename State to Writable.

```js
import { Writable, Readable } from "@borf/browser";

const $$value = new Writable(5);

// Two ways to get a readable from a writable:

// 1: Get it from a Writable
const $value1 = $$value.readable();
const $value1 = $$value.toReadable();
const $value1 = $$value.getReadable();
// Which version of the above looks better? toX is the JS type conversion standard, so that works for me.

// 2: Create one with Readable.from constructor.
const $value2 = Readable.from($$value);

const $constant = new Readable("CAN'T CHANGE ME");
```

Implementation:

```ts
type ObserveCallback<T> = (value: T) => void;

class Readable<T> {
  #value: T;
  #observers: ObserveCallback<T>[];

  constructor(initialValue: T) {
    this.#value = initialValue;
  }

  read() {
    return this.#value;
  }

  map<R>(transform: (value: T) => R): Readable<R> {
    return new MappedReadable<T, R>(this, transform);
  }

  observe(callback: ObserveCallback<T>) {
    this.#observers.push(callback);

    return function stop() {
      this.#observers.splice(this.#observers.indexOf(callback), 1);
    };
  }
}

class MappedReadable<O, T> extends Readable<T> {
  #readable: Readable<O>;
  #transform: (value: O) => T;

  constructor(readable: Readable<O>, transform: (value: O) => T) {
    this.#readable = readable;
    this.#transform = transform;
  }

  read() {
    return this.#transform(this.#readable.read());
  }

  map<R>(transform: (value: T) => R): Readable<R> {
    return new MappedReadable<T, R>(this, transform);
  }

  observe(callback: ObserverCallback<T>) {
    return this.#readable.observe((value) => {
      callback(this.#transform(value));
    });
  }
}

const $value = new Readable("test");
const $x = $value.map((v) => v.toUpperCase());
const $y = new MappedReadable($value, (v) => v.toUpperCase());

const $merged = Readable.merge([$x, $y], (x, y) => {
  return x + y;
});
const $merged = new MergedReadable([$x, $y], (x, y) => {
  return x + y;
});

console.log($value.read());
$$writable.write("new value");

class Writable<T> extends Readable<T> {
  #value: T;
  #observers: ObserverCallback<T>[];

  #notifyObservers() {
    for (const callback of this.#observers) {
      callback(this.#value);
    }
  }

  constructor(initialValue: T) {
    this.#value = initialValue;
  }

  read() {
    return this.#value;
  }

  map<R>(transform: (value: T) => R): Readable<R> {
    return new MappedReadable<T, R>(this, transform);
  }

  observe(callback: ObserverCallback<T>) {
    this.#observers.push(callback);

    return function stop() {
      this.#observers.splice(this.#observers.indexOf(callback), 1);
    };
  }

  write(value: T) {
    if (!deepEqual(this.#value, value)) {
      this.#value = value;
      this.#notifyObservers();
    }
  }

  update(callback: (value: T) => T): void;
  update(callback: (value: T) => void): void;

  update(callback: (value: T) => T | void) {
    // Use immer to derive a new state.'
    const next = produce(this.#value, callback);
    this.write(next);
  }
}
```
