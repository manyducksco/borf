import {
  Receiver,
  Sender,
  Subscribable,
  Subscription,
  TransformFunc,
} from "../types";
import { map, batch, filter } from "./operators";
import { delay } from "./operators/delay";
import { Transmitter } from "./Transmitter";

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

  map<M>(fn: (value: O) => M) {
    return new StateTransmitter<O, M>(fn(this._value), this, map(fn));
  }

  filter(condition: (value: O) => boolean) {
    return new StateTransmitter<O, O>(this._value, this, filter(condition));
  }

  batch(size: number, ms: number) {
    const transform = batch<O>(size, ms);
    return new StateTransmitter<O, O[]>([this.current], this, transform);
  }

  delay(ms: number | Subscribable<number>) {
    return new StateTransmitter<O, O>(this._value, this, delay(ms));
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
