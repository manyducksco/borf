import { Transmitter } from "../Transmitter";
import { TransformFunc } from "../../types";

/**
 * Generic transmitter that mounts a transform function but is its own source.
 */
export class TestSender<I, O = I> extends Transmitter<O> {
  constructor(private transform: TransformFunc<I, O>) {
    super();
  }

  send(value: I) {
    this.transform(value, this._send.bind(this));
  }
}
