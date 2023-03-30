import produce from "immer";
import { Type } from "@borf/bedrock";
import { Writable, Readable, READABLE, type ObserveCallback, type StopFunction } from "./Writable.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Input values passed to the component.
 */
export type InputValues<T = {}> = {
  [K in keyof T]: T[K] | Readable<T[K]> | Writable<T[K]>;
};

/**
 * Defines which inputs a component can take and their properties.
 */
export type InputDefinitions<T> = {
  [K in keyof T]: InputDefinition<T[K]>;
};

type InputDefinition<T> = {
  /**
   * Validates input value at runtime. The app will crash if `validate` returns false or throws an Error.
   */
  assert?: (value: unknown) => boolean;

  /**
   * An example value to show what this input might take.
   */
  example?: T;

  /**
   * Attribute description for viewer.
   */
  about?: string;

  /**
   * The default value if the input is not passed.
   */
  default?: T;

  /**
   * Allows writing back to writable bindings to propagate changes up to a parent view. Also known as two-way binding.
   * All bindings are only readable by default.
   */
  writable?: boolean;

  /**
   * Allows a value to be omitted without defining a default value.
   */
  optional?: boolean;
};

/**
 * Options passed when instantiating Inputs.
 */
interface InputsOptions<T> {
  inputs?: InputValues<T>;
  definitions?: InputDefinitions<T>;
  enableValidation?: boolean;
}

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

  _values?: InputValues<T>;
  _definitions?: InputDefinitions<T>;
  _enableValidation = true;

  _$$inputs: Writable<T>;

  api: InputsAPI<T>;

  constructor({ inputs, definitions, enableValidation = true }: InputsOptions<T>) {
    if (!inputs) {
      inputs = {} as InputValues<T>;
    }

    this._values = inputs;
    this._definitions = definitions;
    this._enableValidation = enableValidation;

    // Sort inputs by binding type.
    for (const _name of Object.keys(inputs)) {
      const name = _name as keyof T;
      const value = inputs[name];

      if (Writable.isWritable(value)) {
        this._writables[name] = value;
      } else if (Readable.isReadable(value)) {
        this._readables[name] = value;
      } else {
        this._statics[name] = value;
      }
    }

    // Set initial values for unpassed attributes with a `default` defined.
    if (definitions) {
      for (const name in definitions) {
        if (!(name in inputs) && definitions[name].default !== undefined) {
          this._statics[name] = definitions[name].default;
        }
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

    this._$$inputs = new Writable(initialValues as T);

    // Create the API to interact with attribute values.
    this.api = new InputsAPI({
      $$inputs: this._$$inputs,
      definitions: this._definitions,
      readables: this._readables,
      writables: this._writables,
      enableValidation: this._enableValidation,
    });
  }

  /**
   * Subscribes to attribute bindings. Called by the framework when the component using these attributes is connected.
   */
  connect() {
    for (const key in this._readables) {
      this._stopCallbacks.push(
        this._readables[key]!.observe((next) => {
          assertValidItem(key, next, this._definitions);

          this._$$inputs.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    for (const key in this._writables) {
      this._stopCallbacks.push(
        this._writables[key]!.observe((next) => {
          assertValidItem(key, next, this._definitions);

          this._$$inputs.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    if (this._enableValidation && this._definitions) {
      assertValidInputs(this._definitions, this._$$inputs.value);
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
  definitions?: InputDefinitions<T>;
  readables: Partial<Record<keyof T, Readable<any>>>;
  writables: Partial<Record<keyof T, Writable<any>>>;
  enableValidation: boolean;
};

/**
 * Provides a State-like API for accessing attribute data.
 */
export class InputsAPI<T> {
  [READABLE] = true;

  #inputs;
  #definitions;
  #readables;
  #writables;
  #enableValidation;

  constructor(options: InputsAPIOptions<T>) {
    this.#inputs = options.$$inputs;
    this.#definitions = options.definitions;
    this.#readables = options.readables;
    this.#writables = options.writables;
    this.#enableValidation = options.enableValidation;
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
      // Ensure key is actually in definitions.
      if (this.#enableValidation && this.#definitions) {
        if (!this.#definitions[key]) {
          throw new Error(
            `Input '${String(key)}' is not defined. Add an entry to your inputs object to accept this input.`
          );
        }
      }

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

    // Make sure values match definitions before committing the new values.
    if (this.#enableValidation && this.#definitions) {
      assertValidInputs(this.#definitions, after);
    }

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

    if (this.#enableValidation && this.#definitions) {
      assertValidInputs(this.#definitions, after);
    }

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
      if (this.#enableValidation && this.#definitions) {
        if (!this.#definitions[key]) {
          throw new Error(
            `Input '${String(key)}' is not defined. Add an entry to your input definition to accept this attribute.`
          );
        }

        if (!this.#definitions[key].writable) {
          throw new Error(
            `Input '${String(
              key
            )}' is not marked as writable. Add 'writable: true' to this input definition to enable two way binding.`
          );
        }
      }

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

function assertValidInputs<T>(definitions: InputDefinitions<T>, values: T) {
  // Fail if required attribute is nullish.
  for (const name in definitions) {
    if (!definitions[name].optional && values[name] == null) {
      throw new TypeError(
        `Attribute '${name}' is required, but value is undefined. Use 'optional: true' in 'inputs.${name}' to make it optional, or provide a 'default' value, if passing this attribute isn't necessary.`
      );
    }
  }

  for (const name in values) {
    assertValidItem(name, values[name], definitions);
  }
}

function assertValidItem<T>(name: keyof T, value: unknown, definitions?: InputDefinitions<T>) {
  if (!definitions) return; // Pass when no definitions are provided.

  const def = definitions[name];

  if (!def) {
    throw new TypeError(`Attribute '${String(name)}' is not defined, but a value was passed. Got: ${value}`);
  }

  if (!def.assert) {
    return; // All values are allowed when no assert function is specified.
  }

  // Type can be a custom validator function taking the item value and returning a boolean.
  if (!Type.isFunction(def.assert)) {
    throw new TypeError(`'assert' field must be a function. Got type: ${Type.of(def.assert)}, value: ${def.assert}`);
  }

  try {
    const valid = def.assert(value);

    if (!valid) {
      throw new TypeError(`Input '${String(name)}' failed type assertion. Got: ${value}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      // TODO: Crash app through crashCollector.
      throw new TypeError(error.message);
    }
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
