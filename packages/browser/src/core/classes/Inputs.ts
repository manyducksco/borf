import produce from "immer";
import { Type } from "@borf/bedrock";
import { Writable, Readable, READABLE, type ObserveCallback, type StopFunction } from "./Writable.js";
import { deepEqual } from "../helpers/deepEqual.js";

export type InputValues<T> = {
  [K in keyof T]: UnwrapReadable<T[K]>;
};

type UnwrapReadable<T> = T extends Readable<infer U> ? U : T;

/**
 * Handles observables, readables, writables and plain values as passed to a View or Store.
 * Exposes an API to work with input values, automatically propagating writable values back to the original binding.
 * Validates against a set of definitions at runtime if supplied.
 */
export class Inputs<T> {
  _stopCallbacks: StopFunction[] = [];

  _readables: Partial<Record<keyof T, Readable<any>>> = {};
  _writables: Partial<Record<keyof T, Writable<any>>> = {};
  _statics: Partial<Record<keyof T, any>> = {};

  _values?: T;

  _$$inputs: Writable<InputValues<T>>;

  api: InputsAPI<InputValues<T>>;

  constructor(values: T) {
    this._values = values;

    // Sort inputs by binding type.
    for (const _name of Object.keys(values as Record<string, any>)) {
      const name = _name as keyof T;
      const value = values[name];

      if (Writable.isWritable(value)) {
        this._writables[name] = value;
      } else if (Readable.isReadable(value)) {
        this._readables[name] = value;
      } else {
        this._statics[name] = value;
      }
    }

    // Assemble current attribute values into a state.
    const initialValues = { ...this._statics };

    for (const name in this._writables) {
      initialValues[name] = this._writables[name]!.value;
    }

    for (const name in this._readables) {
      initialValues[name] = this._readables[name]!.value;
    }

    this._$$inputs = new Writable(initialValues as InputValues<T>);

    // Create the API to interact with attribute values.
    this.api = new InputsAPI<InputValues<T>>({
      $$inputs: this._$$inputs,
      readables: this._readables,
      writables: this._writables,
    });
  }

  /**
   * Subscribes to attribute bindings. Called by the framework when the component using these attributes is connected.
   */
  connect() {
    for (const key in this._readables) {
      this._stopCallbacks.push(
        this._readables[key]!.observe((next) => {
          this._$$inputs.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    for (const key in this._writables) {
      this._stopCallbacks.push(
        this._writables[key]!.observe((next) => {
          this._$$inputs.update((current) => {
            current[key] = next;
          });
        })
      );
    }
  }

  /**
   * Unsubscribes from attribute bindings. Called by the framework when the component using these attributes is disconnected.
   */
  disconnect() {
    for (const stop of this._stopCallbacks) {
      stop();
    }
    this._stopCallbacks = [];
  }
}

/**
 * Options passed when instantiating InputsAPI.
 */
type InputsAPIOptions<T> = {
  $$inputs: Writable<T>;
  readables: Partial<Record<keyof T, Readable<any>>>;
  writables: Partial<Record<keyof T, Writable<any>>>;
};

/**
 * Provides a State-like API for accessing attribute data.
 */
export class InputsAPI<T> extends Readable<T> {
  [READABLE] = true;

  #inputs;
  #readables;
  #writables;

  constructor(options: InputsAPIOptions<T>) {
    super(options.$$inputs);

    this.#inputs = options.$$inputs;
    this.#readables = options.readables;
    this.#writables = options.writables;
  }

  /**
   * Current value of the inputs object.
   */
  get value() {
    return this.#inputs.value;
  }

  /**
   * Gets the current value of the inputs object.
   */
  get(): T;

  /**
   * Gets the current value of a specific input.
   */
  get<K extends keyof T>(name: K): T[K];

  get(key?: keyof T) {
    if (key) {
      return this.#inputs.value[key];
    }

    return this.#inputs.value;
  }

  /**
   * Sets the value of the `name` input to `value`. That input must be defined with `required: true`.
   */
  set<K extends keyof T>(name: K, value: T[K]): void;

  /**
   * Patches the inputs object with a set of keys and values. All passed inputs must be defined with `required: true`.
   *
   * Equivalent to calling `.set(name, value)` for each key in `values`.
   */
  set(values: Partial<T>): void;

  set<K extends keyof T>(keyOrValues: K | Partial<T>, value?: T[K]) {
    let values: Partial<T>;

    if (Type.isObject(keyOrValues)) {
      values = keyOrValues;
    } else {
      values = { [keyOrValues]: value! } as Partial<T>;
    }

    const before = this.#inputs.value;
    const after: T = { ...before, ...values };

    const diff = objectDiff(before, after);

    for (const key in diff) {
      if (deepEqual(diff[key].before, diff[key].after)) {
        continue;
      }

      const value = diff[key].after;
      const writable = this.#writables[key];

      if (writable) {
        writable.value = value; // Update writable.
      } else if (this.#readables[key]) {
        throw new Error(`Tried to set value of read-only input '${key}'. Did you mean to pass a writable binding?`);
      }
    }

    this.#inputs.value = after;
  }

  update(callback: (value: T) => void) {
    Type.assertFunction(callback);

    const before = this.#inputs.value;
    const after = produce(before, callback);

    const diff = objectDiff(before, after);

    for (const key in diff) {
      if (deepEqual(diff[key].before, diff[key].after)) {
        continue;
      }

      const value = diff[key].after;
      const writable = this.#writables[key];

      if (writable) {
        writable.value = value; // Update writable.
      } else if (this.#readables[key]) {
        throw new Error(`Tried to set value of read-only binding '${key}'. Did you mean to pass a writable binding?`);
      }
    }

    this.#inputs.value = after;
  }

  /**
   * Gets a Readable binding to the input called `name`.
   */
  getReadable<K extends keyof T>(name: K): Readable<T[K]>;

  /**
   * Gets the whole inputs object as a Readable.
   */
  getReadable(): Readable<T>;

  getReadable(name?: keyof T) {
    if (name) {
      return this.#inputs.map((current) => current[name]);
    } else {
      return this.#inputs.toReadable();
    }
  }

  /**
   * Gets a Readable binding to the input called `name`.
   * Shorthand for `.getReadable(name)`.
   */
  $<K extends keyof T>(name: K): Readable<T[K]> {
    return this.getReadable(name);
  }

  /**
   * Gets the whole inputs object as a Writable.
   */
  getWritable(): Writable<T>;

  /**
   * Gets a Writable binding to the input called `name`.
   */
  getWritable<K extends keyof T>(name: K): Writable<T[K]>;

  getWritable<K extends keyof T>(key?: K) {
    if (key) {
      return new BoundWritable<T, K>(this, key) as Writable<T[K]>;
    } else {
      return this.#inputs;
    }
  }

  /**
   * Gets a Writable binding to the input called `name`.
   * Shorthand for `.getWritable(name)`.
   */
  $$<K extends keyof T>(name: K): Writable<T[K]> {
    return this.getWritable(name);
  }

  map<N>(transform: (value: T) => N): Readable<N> {
    return this.#inputs.map(transform);
  }

  observe(callback: (value: T) => void): StopFunction {
    return this.#inputs.observe(callback);
  }
}

/**
 * Writable binding to a specific input.
 */
class BoundWritable<T, K extends keyof T> extends Writable<T[K]> {
  #api;
  #key;

  constructor(api: InputsAPI<T>, key: K) {
    super(api.get(key));

    this.#api = api;
    this.#key = key;
  }

  get value() {
    return this.#api.get(this.#key);
  }

  set value(newValue) {
    this.#api.update((current) => {
      current[this.#key] = newValue;
    });
  }

  update(callback: (value: T[K]) => T[K] | void) {
    return this.#api.update((current) => {
      const returned = callback(current[this.#key]);
      if (returned) {
        current[this.#key] = returned;
      }
    });
  }

  map<N>(transform: (value: T[K]) => N): Readable<N> {
    return this.#api.map((current) => transform(current[this.#key]));
  }

  observe(callback: ObserveCallback<T[K]>) {
    return this.toReadable().observe(callback);
  }

  toReadable() {
    return this.#api.map((current) => current[this.#key]);
  }
}

type ObjectDiff<T> = {
  [K in keyof T]: {
    before?: T[K];
    after?: T[K];
  };
};

/**
 * Creates an object that describes the changes between an older and newer version of an object.
 */
function objectDiff<T>(before: T, after: T): ObjectDiff<T> {
  const values: any = {};

  for (const key in before) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key]!.before = before[key];
  }

  for (const key in after) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key]!.after = after[key];
  }

  return values;
}
