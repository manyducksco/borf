import produce from "immer";
import { deepEqual } from "../helpers/deepEqual.js";

export const READABLE = Symbol("Readable");
export const WRITABLE = Symbol("Writable");

/**
 * Callback function to receive new values as they are written.
 */
export type ObserveCallback<T> = (value: T) => void;

/**
 * Stops the observer that created it when called.
 */
export type StopFunction = () => void;

/**
 * Extracts value types from an array of Readables.
 */
export type ValuesOfReadables<T extends Readable<any>[]> = {
  [K in keyof T]: T[K] extends Readable<infer U> ? U : never;
};

/**
 * Read-only observable state container.
 *
 * Using the `$name` convention for instance names (one '$' to indicate readability) may help with code clarity.
 */
export class Readable<T> {
  [READABLE] = true;

  /**
   * Determines if an object is a Readable.
   */
  static isReadable<T>(readable: any): readable is Readable<T> {
    return readable != null && typeof readable === "object" && readable[READABLE] == true;
  }

  /**
   * Merges multiple Readables into one.
   *
   * @param readables - An array of Readables to merge.
   * @param merge - A function that takes the values of the Readables in the order they were passed, and returns the value of the new Readable.
   */
  static merge<R extends Readable<any>[], T>(
    readables: [...R],
    merge: (...values: ValuesOfReadables<R>) => T
  ): Readable<T> {
    return new MergedReadable(readables, merge);
  }

  /**
   * If value is a Readable, returns that readable's value. Otherwise, returns that value as-is.
   * Writables are also Readables, so this will unwrap Writables as well.
   */
  static unwrap<T>(valueOrReadable: T | Readable<T>): T {
    if (Readable.isReadable<T>(valueOrReadable)) {
      return valueOrReadable.value;
    } else {
      return valueOrReadable;
    }
  }

  #source?: Readable<T>; // If present, this Readable acts as a proxy. Mainly used to provide read-only access to a Writable value.
  #observers: ObserveCallback<T>[] = [];
  #value: T;

  /**
   * Creates a Readable from a Writable. Equivalent to `$writable.toReadable()`.
   */
  constructor(writable: Writable<T>);

  /**
   * Creates a Readable from another Readable.
   */
  constructor(readable: Readable<T>);

  /**
   * Creates a Readable with a constant value.
   */
  constructor(initialValue: T);

  constructor(init: Readable<T> | T) {
    if (Readable.isReadable<T>(init)) {
      this.#source = init;
      this.#value = init.value;
    } else {
      this.#value = init;
    }
  }

  /**
   * The value currently stored in this Readable.
   */
  get value(): T {
    if (this.#source) {
      return this.#source.value;
    }
    return this.#value;
  }

  /**
   * Takes a function and calls it with `value` whenever `value` changes.
   * Returns a new Readable containing the latest return value of your transform function.
   *
   * Transform functions must not have side effects.
   */
  map<N>(transform: (value: T) => N): Readable<N> {
    return new MappedReadable<T, N>(this.#source ?? this, transform);
  }

  /**
   * Takes a function and passes `value` to it whenever `value` changes. Returns a function that stops the observer when called.
   *
   * Calling the stop function is important as you can cause memory leaks by adding observers without eventually removing them.
   * Be mindful of this and consider using `ctx.observe($readable, callback)` in Views and Stores. That function
   * will take care of cleaning up observers when the component is disconnected.
   */
  observe(callback: ObserveCallback<T>): StopFunction {
    if (this.#source) {
      return this.#source.observe(callback);
    }

    const observers = this.#observers;
    callback(this.value); // Make initial call with current value.
    observers.push(callback);

    return function stop() {
      // Remove callback from array so it isn't called again.
      observers.splice(observers.indexOf(callback), 1);
    };
  }

  toString() {
    return String(this.value);
  }
}

/**
 * Readable with a value derived by transforming the value of another Readable.
 */
class MappedReadable<F, T> extends Readable<T> {
  [READABLE] = true;

  #readable: Readable<F>;
  #transform: (value: F) => T;

  constructor(readable: Readable<F>, transform: (value: F) => T) {
    super(transform(readable.value));

    this.#readable = readable;
    this.#transform = transform;
  }

  get value() {
    return this.#transform(this.#readable.value);
  }

  map<N>(transform: (value: T) => N): Readable<N> {
    return new MappedReadable<T, N>(this, transform);
  }

  observe(callback: ObserveCallback<T>): StopFunction {
    return this.#readable.observe((value) => {
      callback(this.#transform(value));
    });
  }
}

/**
 * Readable with a value derived from several other Readables.
 */
class MergedReadable<Rs extends Readable<any>[], T> extends Readable<T> {
  [READABLE] = true;

  #readables: Rs;
  #readableValues: any[] = [];
  #mergedValue?: T;

  #merge: (...values: ValuesOfReadables<Rs>) => T;

  // Callback functions awaiting the latest `value`.
  #observers: ObserveCallback<T>[] = [];

  // True when actively observing changes to #readables.
  #isObserving = false;

  // Stop functions from #readables observers.
  #stopCallbacks: StopFunction[] = [];

  constructor(readables: [...Rs], merge: (...values: ValuesOfReadables<Rs>) => T) {
    super(undefined as any);

    this.#readables = readables;
    this.#merge = merge;
  }

  get value() {
    if (this.#isObserving) {
      return this.#mergedValue!;
    } else {
      return this.#merge(...(this.#readables.map((s) => s.value) as ValuesOfReadables<Rs>));
    }
  }

  map<R>(transform: (value: T) => R): Readable<R> {
    return new MappedReadable<T, R>(this, transform);
  }

  observe(callback: ObserveCallback<T>): StopFunction {
    const self = this;

    self.#observers.push(callback);

    if (self.#isObserving) {
      callback(this.#mergedValue!);
    } else {
      self.#startObservingSources();
    }

    return function stop() {
      self.#observers.splice(self.#observers.indexOf(callback), 1);

      if (self.#observers.length === 0) {
        self.#stopObservingSources();
      }
    };
  }

  /**
   * Calculates a new `#currentValue` and notifies observers if different.
   *
   * @param force - Notify observers even if the new value is deepEqual to the previous value.
   */
  #updateValue(force = false) {
    const value = this.#merge(...(this.#readableValues as ValuesOfReadables<Rs>));

    // Skip equality check on initial subscription to guarantee
    // that observers receive an initial value, even if undefined.
    if (force || !deepEqual(value, this.#mergedValue)) {
      this.#mergedValue = value;

      for (const callback of this.#observers) {
        callback(this.#mergedValue);
      }
    }
  }

  /**
   * Start observing `#readables` and merging new values.
   */
  #startObservingSources() {
    if (!this.#isObserving) {
      for (let i = 0; i < this.#readables.length; i++) {
        const source = this.#readables[i];

        this.#stopCallbacks.push(
          source.observe((value) => {
            this.#readableValues[i] = value;

            if (this.#isObserving) {
              this.#updateValue();
            }
          })
        );
      }

      this.#isObserving = true;
      this.#updateValue(true);
    }
  }

  /**
   * Stop observing #readables.
   */
  #stopObservingSources() {
    this.#isObserving = false;

    for (const stop of this.#stopCallbacks) {
      stop();
    }
    this.#stopCallbacks = [];
  }
}

/**
 * Read-write observable state container.
 *
 * Using the `$$name` convention for instance names (two '$' to indicate both readability + writability) may help with code clarity.
 */
export class Writable<T> extends Readable<T> {
  [READABLE] = true;
  [WRITABLE] = true;

  static isWritable<T>(writable: any): writable is Writable<T> {
    return writable != null && typeof writable === "object" && writable[WRITABLE] === true;
  }

  #value: T;
  #observers: ObserveCallback<T>[] = [];

  #notifyObservers() {
    for (const callback of this.#observers) {
      callback(this.#value);
    }
  }

  constructor(initialValue: T) {
    super(initialValue);

    this.#value = initialValue;
  }

  /**
   * Value currently stored in this Writable. Setting it will notify all observers of the new value.
   */
  get value() {
    return this.#value;
  }

  set value(newValue) {
    if (!deepEqual(this.#value, newValue)) {
      this.#value = newValue;
      this.#notifyObservers();
    }
  }

  map<N>(transform: (value: T) => N): Readable<N> {
    return new MappedReadable<T, N>(this, transform);
  }

  observe(callback: ObserveCallback<T>): StopFunction {
    const observers = this.#observers;

    callback(this.value);
    observers.push(callback);

    return function stop() {
      observers.splice(observers.indexOf(callback), 1);
    };
  }

  /**
   * Takes a function and calls it with `value`. The return value of that function becomes the new `value`.
   */
  update(callback: (value: T) => T): void;

  /**
   * Takes a function and calls it with `value`. All mutations made to `value` are applied to the next `value`.
   */
  update(callback: (value: T) => void): void;

  update(callback: (value: T) => T | void) {
    // Use immer to derive a new state
    this.value = produce(this.#value, callback);
  }

  /**
   * Returns a read-only version of this Writable.
   */
  toReadable() {
    return new Readable(this);
  }
}
