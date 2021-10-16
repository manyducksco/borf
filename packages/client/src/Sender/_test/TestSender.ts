import { Sender } from "..";

export class TestSender<T> extends Sender<T> {
  send(value: T) {
    this._send(value);
  }
}
