import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { Type } from "../../../../bedrock/lib";
import { READABLE, WRITABLE } from "../keys.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * A `.get()` and `.set()`-able data container. The primary mechanism for reactivity and data binding in Fronte.
 * If you have data that will change at runtime, a State is most likely where you want to keep it.
 */
export class State {
  /**
   * Merges two or more observables into a single readable state.
   *
   * @param args - Two or more observables followed by a merge function.
   * @returns PolyReadable
   */
  static merge(...args) {
    return new PolyReadable(...args);
  }

  /**
   * Creates a brand new readable state whose value cannot change. Essentially `const` for states.
   *
   * @param value - Permanent value of the Readable.
   * @returns Readable
   */
  static readable(value) {
    return new State(value).readable();
  }

  /**
   * Determines whether `value` is a Readable.
   *
   * @param value - A potential Readable.
   */
  static isReadable(value) {
    return value != null && typeof value[READABLE] === "function" && value[READABLE]() === value;
  }

  /**
   * Determines whether `value` is a Writable.
   *
   * @param value - A potential Writable.
   */
  static isWritable(value) {
    return value != null && typeof value[WRITABLE] === "function" && value[WRITABLE]() === value;
  }

  /**
   * Determines whether `value` is an instance of State.
   *
   * @param value - A potential State.
   */
  static isState(value) {
    return value instanceof State;
  }

  // The current value stored in the State.
  #currentValue;

  // Observers to notify when currentValue is changed.
  #observers = [];

  constructor(initialValue) {
    this.#currentValue = initialValue;
  }

  /**
   * Returns the current value stored in this State.
   */
  get() {
    return this.#currentValue;
  }

  /**
   * Replaces the value stored in this State with `newValue`.
   *
   * @param newValue - New value to set.
   */
  set(newValue) {
    if (!deepEqual(this.#currentValue, newValue)) {
      this.#currentValue = newValue;
      this.#broadcast();
    }
  }

  /**
   * Updates the value stored in this state by either 1) mutating that state inside the `callback` function,
   * or 2) returning a replacement value from the `callback` function.
   *
   * @param callback - A function. Receives the current state and either mutates it or returns a derived state.
   */
  update(callback) {
    if (!Type.isFunction(callback)) {
      throw new TypeError(`Expected an update function. Got: ${typeof callback}`);
    }

    const newValue = produce(this.#currentValue, callback);

    if (!deepEqual(this.#currentValue, newValue)) {
      this.#currentValue = newValue;
      this.#broadcast();
    }
  }

  /**
   * Returns a read-only accessor for this state.
   * Enables parts of the program to access the value without the ability to change it.
   */
  readable() {
    return new Readable(this);
  }

  /**
   * Derives a new state whose value is equal to this State's current value as run through a `transform` function.
   * Think of this like `map` for State.
   *
   * @param transform - A function. Receives the current value and returns a derived value for the new Readable.
   * @returns Readable
   */
  as(transform) {
    if (!Type.isFunction(transform)) {
      throw new TypeError(`Expected a transform function. Got: ${typeof transform}`);
    }

    return new Readable(this, { transform });
  }

  /**
   * Subscribes to changes to this state's value.
   *
   * @param observer - A `next` function or an Observer object. Called every time this State's value changes.
   * @returns Subscription
   */
  subscribe(observer) {
    if (!Type.isObject(observer)) {
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

  /**
   * Notify all observers of the current value. This should run each time the value changes.
   */
  #broadcast() {
    for (const observer of this.#observers) {
      observer.next?.(this.#currentValue);
    }
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

  /**
   * Returns the current value stored in this State.
   */
  get() {
    return this.#transform(this.#writable.get());
  }

  /**
   * Derives a new state whose value is equal to this State's current value as run through a `transform` function.
   * Think of this like `map` for State.
   *
   * @param transform - A function. Receives the current value and returns a derived value for the new Readable.
   * @returns Readable
   */
  as(transform) {
    return this.#writable.as((value) => {
      const transformed = this.#transform(value);
      return transform(transformed);
    });
  }

  /**
   * Subscribes to changes to this state's value.
   *
   * @param observer - A `next` function or an Observer object. Called every time this State's value changes.
   * @returns Subscription
   */
  subscribe(observer) {
    if (!Type.isObject(observer)) {
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
 * Merges the values of several readables into one.
 */
class PolyReadable {
  // The list of Readables this PolyReadable is merging.
  #readables;

  // Latest values of #readables.
  #values = [];

  // Merge function to collapse multiple readable values to one.
  #merge;

  // The current value stored in the State.
  #currentValue;

  // Observers to notify when currentValue is changed.
  #observers = [];

  // Whether the PolyReadable is actively observing changes to #readables.
  #isObserving = false;

  // Subscriptions this PolyReadable is using to track changes to #readables.
  #subscriptions = [];

  /**
   * Forms a single readable by passing the values of many readables through a merge function.
   *
   * @param args - Two or more state bindings to merge followed by a merge function.
   */
  constructor(...args) {
    this.#merge = args.pop();
    this.#readables = args;

    if (!Type.isFunction(this.#merge)) {
      throw new TypeError(`Expected a merge function as the final argument. Got: ${typeof this.#merge}`);
    }
  }

  /**
   * Returns the value stored in this PolyReadable.
   *
   * @returns Readable
   */
  get() {
    let value;

    if (this.#isObserving) {
      value = this.#currentValue;
    } else {
      value = this.#merge(...this.#readables.map((s) => s.get()));
    }

    return value;
  }

  /**
   * Derives a new state whose value is equal to this State's current value as run through a `transform` function.
   * Think of this like `map` for State.
   *
   * @param transform - A function. Receives the current value and returns a derived value for the new Readable.
   * @returns Readable
   */
  as(transform) {
    if (!Type.isFunction(transform)) {
      throw new TypeError(`Expected a transform function. Got: ${typeof transform}`);
    }

    return new Readable(this, { transform });
  }

  /**
   * Subscribes to changes to this state's value.
   *
   * @param observer - A `next` function or an Observer object. Called every time this State's value changes.
   * @returns Subscription
   */
  subscribe(observer) {
    if (!Type.isObject(observer)) {
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

  /**
   * Calculates a new `#currentValue` and notifies observers if necessary.
   *
   * @param force - Notify observers even if the new value is deepEqual to the previous value.
   */
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

  /**
   * Begin observing changes to `#readables` and calculating new values.
   */
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

  /**
   * Stop observing changes to #readables.
   */
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
