import { Source } from "./Source";
import { Bindable, Binding } from "./types";

/**
 * A Source that enables setting the value with a `set` function
 * and two way bindings with a `bind` function.
 */
export class State<Type> extends Source<Type> implements Bindable<Type> {
  /**
   * Sets the current value and broadcasts the change to all listeners.
   */
  set(value: Type): void {
    if (value !== this.value) {
      this.value = value;
      this.broadcast();
    }
  }

  /**
   * Returns an object with methods for two way binding. The `get` function retrieves the current value,
   * `listen` takes a listener function and returns a cancel function, and `set` updates the value and calls all listeners.
   */
  bind(): Binding<Type> {
    return {
      get: () => this.current,
      set: this.set.bind(this),
      listen: this.listen.bind(this),
    };
  }
}
