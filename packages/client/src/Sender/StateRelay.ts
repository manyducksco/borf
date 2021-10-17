import { StateTransmitter } from ".";
import { Receiver } from "../types";

type ProxyFunction<I, O> = (value: I, set: (value: O) => void) => void;

/**
 * Receive values from `source` state using a `proxy` function.
 */
export class StateRelay<I, O> extends StateTransmitter<O> {
  protected _receiver: Receiver<I>;
  protected _proxy: ProxyFunction<I, O>;

  constructor(
    source: StateTransmitter<I>,
    initialValue: O,
    proxy: ProxyFunction<I, O>
  ) {
    super(initialValue);

    const set = this._set.bind(this);

    this._proxy = proxy;
    this._receiver = source.receive();
    this._receiver.callback = (value) => {
      proxy(value, set);
    };
  }
}
