import { Receiver, Sender } from "../types";
import { isReceiver, isSender } from "../utils";
import { Transmitter } from "./Transmitter";

type ProxyFunction<I, O> = (value: I, send: (value: O) => void) => void;

export class Relay<I, O> extends Transmitter<O> {
  protected _source: Receiver<I>;
  protected _proxy: ProxyFunction<I, O>;

  constructor(source: Sender<I> | Receiver<I>, proxy: ProxyFunction<I, O>) {
    super();

    if (isSender(source)) {
      this._source = source.receive();
    } else if (isReceiver(source)) {
      this._source = source;
    } else {
      throw new Error(
        `Expected source to be Sender or Receiver but got ${typeof source}.`
      );
    }

    const send = this._send.bind(this);

    this._proxy = proxy;
    this._source.callback = (value) => {
      proxy(value, send);
    };
  }
}
