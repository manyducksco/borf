import produce from "immer";
import OBSERVABLE from "symbol-observable";
import { Type } from "@frameworke/bedrocke";
import { READABLE, WRITABLE } from "../keys.js";
import { State } from "./State.js";
import { deepEqual } from "../helpers/deepEqual.js";

/**
 * Handles observables, readables, writables and plain values as passed to a View or Store.
 * Exposes an API to work with input values, automatically propagating writable values back to the original binding.
 * Validates against a set of definitions at runtime if supplied.
 */
export class Inputs {
  _subscriptions = [];

  _readables = {};
  _writables = {};
  _observables = {};
  _statics = {};

  constructor({ inputs, definitions, enableValidation = true }) {
    this._attributes = inputs;
    this._definitions = definitions;
    this._enableValidation = enableValidation;

    // Sort inputs by binding type.
    for (const name in inputs) {
      if (State.isWritable(inputs[name])) {
        this._writables[name] = inputs[name];
      } else if (State.isReadable(inputs[name])) {
        this._readables[name] = inputs[name];
      } else if (Type.isObservable(inputs[name])) {
        this._observables[name] = inputs[name];
      } else {
        this._statics[name] = inputs[name];
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
      initialValues[name] = this._writables[name].get();
    }

    for (const name in this._readables) {
      initialValues[name] = this._readables[name].get();
    }

    this._$$values = new State(initialValues);

    // Create the API to interact with attribute values.
    this.api = new InputsAPI(
      this._$$values,
      this._definitions,
      this._readables,
      this._writables,
      this._observables,
      this._enableValidation
    );
  }

  /**
   * Subscribes to attribute bindings. Called by the framework when the component using these attributes is connected.
   */
  connect() {
    for (const key in this._readables) {
      this._subscriptions.push(
        this._readables[key].subscribe((next) => {
          assertValidItem(key, next, this._definitions);

          this._$$values.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    for (const key in this._writables) {
      this._subscriptions.push(
        this._writables[key].subscribe((next) => {
          assertValidItem(key, next, this._definitions);

          this._$$values.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    for (const key in this._observables) {
      subscriptions.push(
        this._observables[key].subscribe((next) => {
          assertValidItem(key, next, this._definitions);

          this._$$values.update((current) => {
            current[key] = next;
          });
        })
      );
    }

    if (this._enableValidation) {
      assertValidInputs(this._definitions, this._$$values.get());
    }
  }

  /**
   * Unsubscribes from attribute bindings. Called by the framework when the component using these attributes is disconnected.
   */
  disconnect() {
    while (this._subscriptions.length > 0) {
      const sub = this._subscriptions.shift();
      sub.unsubscribe();
    }
  }
}

/**
 * Provides a State-like API for accessing attribute data.
 */
class InputsAPI {
  #values;
  #definitions;
  #readables;
  #writables;
  #observables;
  #enableValidation;

  constructor($$values, definitions, readables, writables, observables, enableValidation) {
    this.#values = $$values;
    this.#definitions = definitions;
    this.#readables = readables;
    this.#writables = writables;
    this.#observables = observables;
    this.#enableValidation = enableValidation;
  }

  get(...args) {
    // .get()
    if (args.length === 0) {
      return this.#values.get();
    }

    // .get("key")
    if (args.length === 1 && Type.isString(args[0])) {
      const key = args[0];

      // Ensure key is actually in definitions.
      if (this.#enableValidation && this.#definitions) {
        if (!this.#definitions[key]) {
          throw new Error(
            `Input '${key}' is not defined. Add an entry to your static inputs object to accept this input.`
          );
        }
      }

      return this.#values.get()[key];
    }

    throw new TypeError(`Bad call signature. Expected .get() or .get("key"). Called as .get(${args.join(", ")})`);
  }

  set(...args) {
    let values;

    // .set({ key: value })
    if (args.length === 1 && Type.isObject(args[0])) {
      values = args[0];
    }

    // .set("key", value)
    if (args.length === 2 && Type.isString(args[0])) {
      values = {
        [args[0]]: args[1],
      };
    }

    if (!Type.isObject(values)) {
      throw new TypeError(
        `Bad call signature. Expected .set({ key: value }) or .set("key", value). Called as .set(${args.join(", ")})`
      );
    }

    const before = this.#values.get();
    const after = { ...before, ...values };

    // Make sure values match definitions before committing the new values.
    if (this.#enableValidation) {
      assertValidInputs(this.#definitions, after);
    }

    const diff = objectDiff(before, after);

    for (const key in diff) {
      if (deepEqual(diff[key].before, diff[key].after)) {
        continue;
      }

      const value = diff[key].after;

      if (this.#writables[key]) {
        // Update writable.
        this.#writables[key].set(value);
      } else if (this.#readables[key] || this.#observables[key]) {
        // Don't change. Throw error.
        throw new Error(`Tried to set value of read-only binding '${key}'. Did you mean to pass a writable binding?`);
      }
    }

    this.#values.set(after);
  }

  update(fn) {
    Type.assertFunction(fn, `Bad call signature. Expected .update(fn). Called as .update(${fn})`);

    const before = this.#values.get();
    const after = produce(before, fn);

    if (this.#enableValidation) {
      assertValidInputs(this.#definitions, after);
    }

    const diff = objectDiff(before, after);

    for (const key in diff) {
      if (deepEqual(diff[key].before, diff[key].after)) {
        continue;
      }

      const value = diff[key].after;

      if (this.#writables[key]) {
        // Update writable.
        this.#writables[key].set(value);
      } else if (this.#readables[key] || this.#observables[key]) {
        // Don't change. Throw error.
        throw new Error(`Tried to set value of read-only binding '${key}'. Did you mean to pass a writable binding?`);
      }
    }

    this.#values.set(after);
  }

  readable(...args) {
    if (args.length === 0) {
      return this.#values.readable();
    }

    if (Type.isString(args[0])) {
      return this.#values.as((current) => current[args[0]]);
    }

    throw new TypeError(
      `Bad call signature. Expected .readable() or .readable("key"). Called as .readable(${args.join(", ")})`
    );
  }

  writable(key) {
    if (key == null) {
      return this.#values;
    }

    if (this.#enableValidation && this.#definitions) {
      if (!this.#definitions[key]) {
        throw new Error(
          `Input '${key}' is not defined. Add an entry to your attributes object to accept this attribute.`
        );
      }

      if (!this.#definitions[key].writable) {
        throw new Error(
          `Input '${key}' is not marked as writable. Add 'writable: true' to this attribute to enable two way binding.`
        );
      }
    }

    return new WritableInput(this, key);
  }

  as(transform) {
    return this.#values.as(transform);
  }

  subscribe(...args) {
    return this.#values.subscribe(...args);
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
 * Writable binding to a specific input.
 */
class WritableInput {
  #api;
  #key;

  constructor(api, key) {
    this.#api = api;
    this.#key = key;
  }

  get() {
    return this.#api.get(this.#key);
  }

  set(value) {
    return this.#api.update((current) => {
      current[this.#key] = value;
    });
  }

  update(fn) {
    return this.#api.update((current) => {
      const returned = fn(current[this.#key]);
      if (returned) {
        current[this.#key] = returned;
      }
    });
  }

  readable() {
    return this.#api.as((current) => current[this.#key]);
  }

  as(fn) {
    return this.#api.as((current) => fn(current[this.#key]));
  }

  subscribe(...args) {
    return this.readable().subscribe(...args);
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

function assertValidInputs(definitions, values) {
  if (definitions == null) {
    return; // Pass when no definitions are provided.
  }

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

function assertValidItem(name, value, definitions) {
  if (definitions == null) {
    return; // Pass when no definitions are provided.
  }

  const def = definitions[name];

  if (!def) {
    throw new TypeError(`Attribute '${name}' is not defined, but a value was passed. Got: ${value}`);
  }

  if (!def.type) {
    return; // All values are allowed when no type is specified.
  }

  // Type can be a custom validator function taking the item value and returning a boolean.
  if (Type.isFunction(def.type)) {
    if (!def.type(value)) {
      throw new TypeError(`Attribute '${name}' failed type validation. Got: ${value}`);
    }
  }

  // If not a function, type can be one of these strings.
  switch (def.type) {
    case "boolean":
      if (!Type.isBoolean(value)) {
        throw new TypeError(`Input '${name}' must be a boolean. Got: ${value}`);
      }
      break;
    case "string":
      if (!Type.isString(value)) {
        throw new TypeError(`Input '${name}' must be a string. Got: ${value}`);
      }
      break;
    case "number":
      if (!Type.isNumber(value)) {
        throw new TypeError(`Input '${name}' must be a number. Got: ${value}`);
      }
      break;
    case "array":
      if (!Type.isArray(value)) {
        throw new TypeError(`Input '${name}' must be an array. Got: ${value}`);
      }
      break;
    case "object":
      if (!Type.isObject(value)) {
        throw new TypeError(`Input '${name}' must be an object. Got: ${value}`);
      }
      break;
    case "function":
      if (!Type.isFunction(value)) {
        throw new TypeError(`Input '${name}' must be a function. Got: ${value}`);
      }
      break;
    default:
      throw new TypeError(`Input '${name}' is assigned an unrecognized type '${def.type}'.`);
  }
}

/**
 * Creates an object that describes the changes between an older and newer version of an object.
 */
function objectDiff(before, after) {
  const values = {};

  for (const key in before) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key].before = before[key];
  }

  for (const key in after) {
    if (!values[key]) {
      values[key] = { before: undefined, after: undefined };
    }

    values[key].after = after[key];
  }

  return values;
}
