import { Receiver } from "./Receiver";

/**
 * Generic structure class implementing a Sender.
 * Subclass this to implement sending logic.
 */
export abstract class Sender<T> {
  #receivers: Receiver<T>[] = [];

  receive(callback?: (message: T) => void): Receiver<T> {
    const receiver = new Receiver<T>(this._cancel.bind(this), callback);

    this.#receivers.push(receiver);
    return receiver;
  }

  /**
   * Sends a message to all receivers.
   *
   * @param message - message to send
   */
  protected _send(message: T) {
    for (const receiver of this.#receivers) {
      if (receiver.callback) {
        receiver.callback(message);
      }
    }
  }

  /**
   * Cancels a receiver, preventing it from receiving future messages.
   *
   * @param receiver - receiver to cancel
   */
  protected _cancel(receiver: Receiver<T>) {
    this.#receivers.splice(this.#receivers.indexOf(receiver), 1);
  }
}
