import { Receiver, Sender } from "../types";

export class Transmitter<T> implements Sender<T> {
  protected _receivers: Receiver<T>[] = [];

  receive(callback?: (value: T) => void): Receiver<T> {
    const cancel = this._cancel.bind(this);
    const receiver = {
      cancel() {
        cancel(receiver);
      },
      callback,
    };

    this._receivers.push(receiver);
    return receiver;
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
