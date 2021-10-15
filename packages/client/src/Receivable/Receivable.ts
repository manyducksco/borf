/**
 * Generic structure class implementing Receivable.
 * Subclass this to implement message sending.
 */
export abstract class Receivable<T> {
  #receivers: Receiver<T>[] = [];

  receive(callback?: (value: T) => void): Receiver<T> {
    const receiver = new Receiver<T>(this._cancel.bind(this), callback);

    this.#receivers.push(receiver);
    return receiver;
  }

  /**
   * Sends a value to all receivers.
   *
   * @param value - value to send
   */
  protected _send(value: T) {
    for (const receiver of this.#receivers) {
      if (receiver.callback) {
        receiver.callback(value);
      }
    }
  }

  /**
   * Cancels a receiver, preventing it from receiving future values.
   *
   * @param receiver - receiver to cancel
   */
  protected _cancel(receiver: Receiver<T>) {
    this.#receivers.splice(this.#receivers.indexOf(receiver), 1);
  }
}

export interface Listener<T> {
  callback?: (value: T) => void;
}

export class Receiver<T> implements Listener<T> {
  #cancel: (receiver: Receiver<T>) => void;
  callback?: (value: T) => void;

  constructor(
    cancel: (receiver: Receiver<T>) => void,
    callback?: (value: T) => void
  ) {
    this.#cancel = cancel;
    this.callback = callback;
  }

  cancel() {
    this.#cancel(this);
  }
}
