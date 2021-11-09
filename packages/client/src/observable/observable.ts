interface Observable<T> {
  /**
   * Returns the current value.
   */
  (): T;

  /**
   * Sets a new value.
   */
  (value: T): T;

  /**
   * Calls the listener function when the value is updated. Returns a cancel function.
   */
  (listener: (value: T) => void): () => void;

  map<O>(fn: (value: T) => O): Cancelable<O>;

  filter(fn: (value: T) => boolean): Cancelable<T>;
}

interface Cancelable<T> extends Observable<T> {
  cancel(): void;
}

/**
 * Returns a function that takes either:
 *  - nothing (returns the current value)
 *  - a new value to replace the current value (returns the new value)
 *  - a function to receive new values (returns a cancel function)
 */
export function observable<T = any>(initialValue?: T): Observable<T> {
  let value: T | undefined = initialValue;
  let listeners: Array<(value: T) => void> = [];

  function o(): T;
  function o(value: T): T;
  function o(listener: (value: T) => void): () => void;

  function o(arg?: T | ((value: T) => void)) {
    if (arg instanceof Function) {
      listeners.push(arg);

      return function () {
        listeners.splice(listeners.indexOf(arg), 1);
      };
    }

    if (arg !== undefined) {
      value = arg;

      if (value !== undefined) {
        for (const listener of listeners) {
          listener(value);
        }
      }
    }

    return value;
  }

  o.map = function <O>(fn: (value: T) => O): Cancelable<O> {
    return relay<T, O>(this, fn);
  };

  o.filter = function (fn: (value: T) => boolean) {
    return relay<T, T>(this, (value) => {
      if (fn(value)) return value;
    });
  };

  return o;
}

function relay<I, O>(
  source: Observable<I>,
  transform: (value: I) => O | undefined
): Cancelable<O> {
  const o = observable<O>(transform(source())) as Cancelable<O>;

  o.cancel = source((value) => {
    const t = transform(value);
    if (t !== undefined) o(t);
  });

  return o;
}
