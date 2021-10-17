import { Binding, Receiver } from "../types";
import { StateTransmitter } from "./StateTransmitter";

/**
 * A sender that stores a value and notifies receivers when that value changes.
 */
export class State<T> extends StateTransmitter<T> {
  /**
   * Sets a new value.
   */
  set(value: T) {
    this._set(value);
  }

  /**
   * Creates a Binding for two-way data binding.
   */
  bind(): Binding<T> {
    return {
      initialValue: this.current,
      receiver: this.receive(),
      set: this.set.bind(this),
    };
  }
}

export class StateReceiver<T> implements Receiver<T> {
  constructor(
    private _cancel: (receiver: Receiver<T>) => void,
    public callback?: (value: T) => void
  ) {}

  cancel() {
    this._cancel(this);
  }
}
