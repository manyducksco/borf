import { Receivable } from "../Receivable";

export class TestSender<T> extends Receivable<T> {
  send(value: T) {
    this._send(value);
  }
}
