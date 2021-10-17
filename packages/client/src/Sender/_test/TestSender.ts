import { Transmitter } from "..";

export class TestSender<T> extends Transmitter<T> {
  send(value: T) {
    this._send(value);
  }
}
