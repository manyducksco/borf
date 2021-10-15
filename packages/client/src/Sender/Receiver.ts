/**
 * Receives messages from a Sender through its callback function.
 */
export class Receiver<T> {
  #cancel: (receiver: Receiver<T>) => void;
  callback?: (message: T) => void;

  constructor(
    cancel: (receiver: Receiver<T>) => void,
    callback?: (message: T) => void
  ) {
    this.#cancel = cancel;
    this.callback = callback;
  }

  cancel() {
    this.#cancel(this);
  }
}
