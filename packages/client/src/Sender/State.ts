import { Binding, Receiver, Subscription } from "../types";
import { StateRelay } from "./StateRelay";
import { Transmitter } from "./Transmitter";

/**
 * A read-only state sender. Values can only be set from inside a StateTransmitter or a subclass of StateTransmitter.
 */
export class StateTransmitter<T> extends Transmitter<T> {
  protected _value: T;

  /**
   * The current value.
   */
  get current() {
    return this._value;
  }

  constructor(initialValue: T) {
    super();
    this._value = initialValue;
  }

  /**
   * Creates a Subscription for one-way data binding.
   */
  subscribe(): Subscription<T> {
    return {
      initialValue: this.current,
      receiver: this.receive(),
    };
  }

  map<O>(transform: (value: T) => O) {
    return new StateRelay<T, O>(
      this,
      transform(this.current),
      (value, send) => {
        send(transform(value));
      }
    );
  }

  filter(condition: (value: T) => boolean) {
    return new StateRelay<T, T>(this, this.current, (value, send) => {
      if (condition(value)) {
        send(value);
      }
    });
  }

  /**
   * Sets a new value and notifies receivers.
   */
  protected _set(value: T) {
    if (value !== this._value) {
      this._value = value;
      this._send(value);
    }
  }

  /**
   * Sends a value to all receivers.
   *
   * @param value - Data to send
   */
  protected _send(value: T) {
    for (const receiver of this._receivers) {
      if (receiver.callback) {
        receiver.callback(value);
      }
    }
  }

  /**
   * Cancels a receiver, preventing it from receiving any new values.
   *
   * @param receiver - Receiver to cancel
   */
  protected _cancel(receiver: Receiver<T>) {
    this._receivers.splice(this._receivers.indexOf(receiver), 1);
  }
}

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
