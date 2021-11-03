import { Listenable, Listener, Operator } from "./types";

/**
 * Base class for objects that broadcast one value to many listeners.
 */
export abstract class Source<Type> implements Listenable<Type> {
  protected value: Type;
  protected listeners: Listener<Type>[] = [];

  constructor(value: Type) {
    this.value = value;
  }

  /**
   * Returns the current value.
   */
  get current() {
    return this.value;
  }

  /**
   * Broadcasts the current value to all listeners.
   */
  broadcast(): void {
    for (const listener of this.listeners) {
      listener(this.value);
    }
  }

  /**
   * Takes a listener function and returns a cancel function.
   *
   * @param callback - Callback to listen for changed values.
   */
  listen(callback: Listener<Type>) {
    const { listeners } = this;

    listeners.push(callback);

    return function cancel() {
      listeners.splice(listeners.indexOf(callback), 1);
    };
  }

  /**
   * Forwards the result of each value run through the `transform` function.
   *
   * @param transform - Function to transform values before forwarding.
   */
  map<To>(transform: (value: Type) => To) {
    return new Relay<Type, To>(this, (value, send) => {
      send(transform(value));
    });
  }

  /**
   * Forwards only values for which the condition returns truthy.
   *
   * @param condition - Function to decide whether to forward the value.
   */
  filter(condition: (value: Type) => boolean) {
    return new Relay<Type>(this, (value, send) => {
      if (condition(value)) {
        send(value);
      }
    });
  }

  /**
   * Forwards values after `wait` milliseconds.
   *
   * @param wait - Milliseconds to wait before forwarding value.
   */
  delay(wait: number) {
    return new Relay<Type>(this, (value, send) => {
      setTimeout(() => {
        send(value);
      }, wait);
    });
  }

  /**
   * Forwards the most recent value after no values are received for `ms` milliseconds.
   *
   * @param wait - Milliseconds to wait from last value.
   * @param immediate - Forward value immediately if time since last value is more than `wait` ms.
   */
  debounce(wait: number, immediate: boolean = false) {
    let timeout: any;

    return new Relay<Type>(this, (value, send) => {
      clearTimeout(timeout);

      if (immediate && !timeout) {
        send(value);
      }

      timeout = setTimeout(() => {
        timeout = null;

        if (!immediate) {
          send(value);
        }
      }, wait);
    });
  }

  /**
   * Ignores all values sent for `ms` milliseconds after a value is sent.
   *
   * @param wait - Milliseconds to wait before accepting values again.
   */
  throttle(wait: number) {
    let next = 0;

    return new Relay<Type>(this, (value, send) => {
      const now = Date.now();

      if (now >= next) {
        send(value);
        next = now + wait;
      }
    });
  }

  /**
   * Groups several messages and sends them as an array, either when the `size` is reached
   * or after `ms` milliseconds passes since the last message.
   *
   * @param size - Items to accumulate before sending the array.
   * @param wait - Milliseconds to wait before sending an incomplete array.
   */
  batch(size: number, wait: number) {
    let timeout: any;
    let batch: Type[] = [];

    return new Relay<Type, Type[]>(this, (value, send) => {
      clearTimeout(timeout);

      batch.push(value);

      if (batch.length === size) {
        send(batch);
        batch = [];
      } else {
        timeout = setTimeout(() => {
          send(batch);
          batch = [];
        }, wait);
      }
    });
  }
}

/**
 * Forwards values sent from a Source through an operator function.
 */
export class Relay<Input, Output = Input> extends Source<Output> {
  constructor(
    private source: Listenable<Input>,
    private operator: Operator<Input, Output>
  ) {
    let value: any;

    operator(source.current, (x) => {
      value = x;
    });

    super(value);
  }

  get current() {
    let pulled: Output;

    this.operator(this.source.current, (value) => {
      pulled = value;
    });

    return pulled!;
  }

  listen(callback: Listener<Output>) {
    return this.source.listen((value) => {
      this.operator(value, callback);
    });
  }
}
