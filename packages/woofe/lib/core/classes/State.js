import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { READABLE, WRITABLE } from "../keys.js";
import { deepEqual } from "../helpers/deepEqual.js";
import { isFunction, isObject } from "../helpers/typeChecking.js";

export class State {
  static merge(...args) {
    return new PolyReadable(...args);
  }

  static isReadable(value) {
    return value != null && typeof value[READABLE] === "function" && value[READABLE]() === value;
  }

  static isWritable(value) {
    return value != null && typeof value[WRITABLE] === "function" && value[WRITABLE]() === value;
  }

  static isState(value) {
    return value instanceof State;
  }

  #currentValue;
  #observers = [];

  constructor(initialValue) {
    this.#currentValue = initialValue;
  }

  get() {
    return this.#currentValue;
  }

  set(newValue) {
    if (!deepEqual(this.#currentValue, newValue)) {
      this.#currentValue = newValue;
      this.#broadcast();
    }
  }

  update(callback) {
    if (!isFunction(callback)) {
      throw new TypeError(`Expected an update function. Got: ${typeof callback}`);
    }

    const newValue = produce(this.#currentValue, callback);

    if (!deepEqual(this.#currentValue, newValue)) {
      this.#currentValue = newValue;
      this.#broadcast();
    }
  }

  readable() {
    return new Readable(this);
  }

  as(transform) {
    if (!isFunction(transform)) {
      throw new TypeError(`Expected a transform function. Got: ${typeof transform}`);
    }

    return new Readable(this, { transform });
  }

  subscribe(observer) {
    if (!isObject(observer)) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    this.#observers.push(observer);
    observer.next?.(this.#currentValue);

    return {
      unsubscribe: () => {
        this.#observers.splice(this.#observers.indexOf(observer), 1);
      },
    };
  }

  [OBSERVABLE]() {
    return this;
  }

  [READABLE]() {
    return this;
  }

  [WRITABLE]() {
    return this;
  }

  #broadcast() {
    // Run key observers and separate out state observers for later.
    for (const observer of this.#observers) {
      observer.next?.(this.#currentValue);
    }
  }
}

/**
 * Wraps a Writable to allow read access but prevent writes.
 * Optionally, takes a `transform` callback to make this a mapped readable.
 */
class Readable {
  #writable;
  #transform = (x) => x;

  constructor(writable, { transform } = {}) {
    this.#writable = writable;

    if (transform) {
      this.#transform = transform;
    }
  }

  get() {
    return this.#transform(this.#writable.get());
  }

  as(transform) {
    return this.#writable.as((value) => {
      const transformed = this.#transform(value);
      return transform(transformed);
    });
  }

  subscribe(observer) {
    if (!isObject(observer)) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    return this.#writable.subscribe((value) => {
      const transformed = this.#transform(value);
      observer.next(transformed);
    });
  }

  [OBSERVABLE]() {
    return this;
  }

  [READABLE]() {
    return this;
  }
}

/**
 * Forms a single readable by passing the values of several other readables through a merge function.
 *
 * @param args - Two or more state bindings to merge followed by a merge function.
 */
class PolyReadable {
  #readables;
  #merge;
  #observers = [];
  #currentValue;

  #isObserving = false;
  #subscriptions = [];
  #values = [];

  constructor(...args) {
    this.#merge = args.pop();
    this.#readables = args;

    if (!isFunction(this.#merge)) {
      throw new TypeError(`Expected a merge function as the final argument. Got: ${typeof this.#merge}`);
    }
  }

  get() {
    let value;

    if (this.#isObserving) {
      value = this.#currentValue;
    } else {
      value = this.#merge(...this.#readables.map((s) => s.get()));
    }

    return value;
  }

  as(transform) {
    if (!isFunction(transform)) {
      throw new TypeError(`Expected a transform function. Got: ${typeof transform}`);
    }

    return new Readable(this, { transform });
  }

  subscribe(observer) {
    if (!isObject(observer)) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    this.#observers.push(observer);

    if (this.#isObserving) {
      observer.next?.(this.get());
    } else {
      this.#subscribeToSources();
    }

    return {
      unsubscribe: () => {
        this.#observers.splice(this.#observers.indexOf(observer), 1);

        if (this.#observers.length === 0) {
          this.#unsubscribeFromSources();
        }
      },
    };
  }

  #updateValue(force = false) {
    const value = this.#merge(...this.#values);

    // Skip equality check on initial subscription to guarantee
    // that observers receive an initial value, even if undefined.
    if (force || !deepEqual(value, this.#currentValue)) {
      this.#currentValue = value;

      for (const observer of this.#observers) {
        observer.next(this.#currentValue);
      }
    }
  }

  #subscribeToSources() {
    if (!this.#isObserving) {
      for (let i = 0; i < this.#readables.length; i++) {
        const source = this.#readables[i];

        this.#subscriptions.push(
          source.subscribe({
            next: (value) => {
              this.#values[i] = value;

              if (this.#isObserving) {
                this.#updateValue();
              }
            },
          })
        );
      }

      this.#isObserving = true;
      this.#updateValue(true);
    }
  }

  #unsubscribeFromSources() {
    this.#isObserving = false;

    for (const subscription of this.#subscriptions) {
      subscription.unsubscribe();
    }
  }

  [OBSERVABLE]() {
    return this;
  }

  [READABLE]() {
    return this;
  }
}
