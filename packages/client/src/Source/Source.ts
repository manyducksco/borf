import { Listener, Receivable, Receiver } from "./types";

/**
 * Base class for objects that broadcast one value to many listeners.
 */
export abstract class Source<Type> implements Receivable<Type> {
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
   * Returns an object with methods for receiving values. The `pull` function retrieves the current value on demand,
   * while the `listen` function takes a callback and returns a function to cancel the listener.
   */
  receive(): Receiver<Type> {
    const { listeners } = this;

    return {
      pull: () => this.value,
      listen: (callback: Listener<Type>) => {
        listeners.push(callback);

        return function cancel() {
          listeners.splice(listeners.indexOf(callback), 1);
        };
      },
    };
  }
}
