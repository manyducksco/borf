import { Sender } from "../_base";

export class TestSender<T> extends Sender<T> {
  send(value: T) {
    this._send(value);
  }
}
