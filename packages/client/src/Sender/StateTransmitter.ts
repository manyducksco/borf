import { Receiver, Sender, Subscription } from "../types";
import { Transmitter, TransformFunc } from "./Transmitter";

/**
 * A read-only state sender. Values can be set from inside a StateTransmitter or a subclass of StateTransmitter.
 */
export class StateTransmitter<I, O = I> extends Transmitter<I, O> {
  protected _value: O;

  /**
   * The current value.
   */
  get current() {
    return this._value;
  }

  constructor(
    initialValue: O,
    source?: Sender<I> | Receiver<I>,
    transform?: TransformFunc<I, O>
  ) {
    super(source, transform);
    this._value = initialValue;
  }

  /**
   * Creates a Subscription for one-way data binding.
   */
  subscribe(): Subscription<O> {
    return {
      initialValue: this.current,
      receiver: this.receive(),
    };
  }

  map<R>(transform: (value: O) => R) {
    return new StateTransmitter<O, R>(
      transform(this._value),
      this,
      (message, send) => {
        send(transform(message));
      }
    );
  }

  // filter(condition: (value: T) => boolean) {
  //   // TODO: Potential bug; filtered relay could end up with an initialValue that wouldn't have passed the filter.
  //   return new StateRelay<T, T>(this, this.current, (value, send) => {
  //     if (condition(value)) {
  //       send(value);
  //     }
  //   });
  // }

  /**
   * Sets a new value and notifies receivers.
   */
  protected _set(value: O) {
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
  protected _send(value: O) {
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
  protected _cancel(receiver: Receiver<O>) {
    this._receivers.splice(this._receivers.indexOf(receiver), 1);
  }
}
