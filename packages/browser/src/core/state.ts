import { deepEqual } from "./utils/deepEqual.js";

// Symbol to mark an observed value as unobserved. Callbacks are always called once for unobserved values.
const UNOBSERVED = Symbol("Unobserved");

/*==============================*\
||             Types            ||
\*==============================*/

/**
 * Stops the observer that created it when called.
 */
export type StopFunction = () => void;

/**
 * Extracts value types from an array of Readables.
 */
export type ReadableValues<T extends Readable<any>[]> = {
  [K in keyof T]: T[K] extends Readable<infer U> ? U : never;
};

export type Unwrapped<T> = T extends Readable<infer U> ? U : T;

export interface Readable<T> {
  /**
   * Returns the current value.
   */
  get(): T;

  /**
   * Receives the latest value with `callback` whenever the value changes.
   */
  observe(callback: (currentValue: T) => void): StopFunction;
}

export interface Writable<T> extends Readable<T> {
  /**
   * Sets a new value.
   */
  set(value: T): void;

  /**
   * Passes the current value to `callback` and takes `callback`'s return value as the new value.
   */
  update(callback: (currentValue: T) => T): void;
}

/*==============================*\
||           Utilities          ||
\*==============================*/

export function isReadable<T>(value: any): value is Readable<T> {
  return (
    value != null && typeof value === "object" && typeof value.get === "function" && typeof value.observe === "function"
  );
}

export function isWritable<T>(value: any): value is Writable<T> {
  return isReadable(value) && typeof (value as any).set === "function" && typeof (value as any).update === "function";
}

/*==============================*\
||          readable()          ||
\*==============================*/

export function readable<T>(value: Writable<T>): Readable<Unwrapped<T>>;
export function readable<T>(value: Readable<T>): Readable<Unwrapped<T>>;
export function readable<T>(value: undefined): Readable<T | undefined>;
export function readable<T>(value: T): Readable<Unwrapped<T>>;

export function readable(value: unknown): Readable<any> {
  // Return a proxy Readable with the value of this Writable.
  if (isWritable(value)) {
    return {
      get: value.get,
      observe: value.observe,
    };
  }

  // Return the same Readable.
  if (isReadable(value)) {
    return value;
  }

  // Return a new Readable.
  return {
    get: () => value,
    observe: (callback) => {
      callback(value); // call with current value
      return function stop() {}; // value can never change, so this function is not implemented
    },
  };
}

/*==============================*\
||          writable()          ||
\*==============================*/

export function writable<T>(value: Writable<T>): Writable<Unwrapped<T>>;
export function writable<T>(value: Readable<T>): void; // TODO: How to throw a type error in TS before runtime?
export function writable<T>(value: undefined): Writable<T | undefined>;
export function writable<T>(value: T): Writable<Unwrapped<T>>;

export function writable(value: unknown): Writable<any> {
  // Return the same Writable.
  if (isWritable(value)) {
    return value;
  }

  // Throw error; can't add write access to a Readable.
  if (isReadable(value)) {
    throw new TypeError(`Failed to convert Readable into a Writable; can't add write access to a read-only value.`);
  }

  const observers: ((currentValue: any) => void)[] = [];

  let currentValue = value;

  // Return a new Writable.
  return {
    // ----- Readable ----- //

    get: () => currentValue,
    observe: (callback) => {
      observers.push(callback); // add observer

      callback(currentValue); // call with current value

      // return function to remove observer
      return function stop() {
        observers.splice(observers.indexOf(callback), 1);
      };
    },

    // ----- Writable ----- //

    set: (newValue) => {
      if (!deepEqual(currentValue, newValue)) {
        currentValue = newValue;
        for (const callback of observers) {
          callback(currentValue);
        }
      }
    },
    update: (callback) => {
      const newValue = callback(currentValue);
      if (!deepEqual(currentValue, newValue)) {
        currentValue = newValue;
        for (const callback of observers) {
          callback(currentValue);
        }
      }
    },
  };
}

/*==============================*\
||          computed()          ||
\*==============================*/

export function computed<I, O>(readable: Readable<I>, compute: (currentValue: I) => O): Readable<O>;

export function computed<I extends Readable<any>[], O>(
  readables: [...I],
  compute: (...currentValues: ReadableValues<I>) => O
): Readable<O>;

export function computed(...args: any): Readable<any> {
  if (isReadable(args[0]) && typeof args[1] === "function") {
    const readable = args[0];
    const compute = args[1];

    return {
      get: () => compute(readable.get()),
      observe: (callback) => {
        let lastValue: any = UNOBSERVED;

        return readable.observe((currentValue) => {
          const computedValue = compute(currentValue);

          if (!deepEqual(computedValue, lastValue)) {
            lastValue = computedValue;
            callback(computedValue);
          }
        });
      },
    };
  } else if (Array.isArray(args[0]) && typeof args[1] === "function") {
    const readables = args[0];
    const compute = args[1];

    const observers: ((currentValues: any) => void)[] = [];

    let stopCallbacks: StopFunction[] = [];
    let isObserving = false;
    let observedValues: any[] = [];
    let computedValue: any = UNOBSERVED;

    function updateValue() {
      const value = compute(...observedValues);

      // Skip equality check on initial subscription to guarantee
      // that observers receive an initial value, even if undefined.
      if (!deepEqual(value, computedValue)) {
        computedValue = value;

        for (const callback of observers) {
          callback(computedValue);
        }
      }
    }

    function startObserving() {
      if (isObserving) return;

      for (let i = 0; i < readables.length; i++) {
        const readable = readables[i];

        stopCallbacks.push(
          readable.observe((value: any) => {
            observedValues[i] = value;

            if (isObserving) {
              updateValue();
            }
          })
        );
      }

      isObserving = true;
      observedValues = readables.map((x) => x.get());
      updateValue();
    }

    function stopObserving() {
      isObserving = false;

      for (const callback of stopCallbacks) {
        callback();
      }
      stopCallbacks = [];
    }

    return {
      get: () => {
        if (isObserving) {
          return computedValue;
        } else {
          return compute(...readables.map((x) => x.get()));
        }
      },
      observe: (callback) => {
        observers.push(callback);

        if (isObserving) {
          callback(computedValue);
        } else {
          startObserving();
        }

        return function stop() {
          observers.splice(observers.indexOf(callback), 1);

          if (observers.length === 0) {
            stopObserving();
          }
        };
      },
    };
  } else {
    throw new TypeError(`Called with incorrect arguments.`);
  }
}

/*==============================*\
||           unwrap()           ||
\*==============================*/

export function unwrap<T>(value: Readable<T> | T): T;

export function unwrap(value: any) {
  if (isReadable(value)) {
    return value.get();
  }

  return value;
}
