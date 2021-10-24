import { map } from "./operators/map";
import { filter } from "./operators/filter";
import { delay } from "./operators/delay";
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
   * Takes a callback and returns a function to cancel the listener.
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

  map<To>(transform: (value: Type) => To) {
    return new Relay<Type, To>(this, (value, send) => {
      send(transform(value));
    });
  }

  // filter(condition: (value: Type) => boolean) {
  //   return filter(this, condition);
  // }

  delay(wait: number) {
    return new Relay<Type>(this, (value, send) => {
      setTimeout(() => {
        send(value);
      }, wait);
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
