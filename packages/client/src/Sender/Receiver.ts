type ReceiverOptions<T> = {
  cancel: (receiver: Receiver<T>) => void;
  callback?: (data: T) => void;
};

/**
 * Receives data from a Sender through its callback function.
 */
export class Receiver<T> {
  #cancel: (receiver: Receiver<T>) => void;
  callback?: (data: T) => void;

  constructor(options: ReceiverOptions<T>) {
    this.#cancel = options.cancel;
    this.callback = options.callback;
  }

  cancel() {
    this.#cancel(this);
  }
}
