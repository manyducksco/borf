import { Source } from "./Source";
import { Binding } from "./types";

/**
 * A Source that enables setting its value with a `set` function
 * and two way bindings to the value it holds with a `bind` function.
 */
export class State<Type> extends Source<Type> {
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
   * Returns an object with methods for binding a value. The `pull` function retrieves the current value on demand,
   * the `listen` function takes a callback and returns a function to cancel the listener, and the `set` function
   * updates the value and notifies all listeners.
   */
  bind(): Binding<Type> {
    return {
      ...this.receive(),
      set: this.set.bind(this),
    };
  }
}
