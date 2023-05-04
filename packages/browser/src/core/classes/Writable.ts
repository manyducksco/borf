import produce from "immer";
import { deepEqual } from "../helpers/deepEqual.js";
import { READABLE, Readable, MappedReadable, type ObserveCallback, type StopFunction } from "./Readable.js";

export const WRITABLE = Symbol("Writable");

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
