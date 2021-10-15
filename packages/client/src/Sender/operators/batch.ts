import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Returns a new Sender that holds several values and sends them as an array, either when
 * the `size` is reached or `timeout` milliseconds passes since the last message.
 *
 * @param receiver - a receiver
 * @param size - amount of items to accumulate before sending the array
 * @param ms - amount of milliseconds to wait before sending an incomplete array
 */
export const batch = <T>(receiver: Receiver<T>, size: number, ms: number) =>
  new BatchedSender(receiver, size, ms);

class BatchedSender<T> extends Sender<T[]> {
  #timeout?: any;
  #batch: T[] = [];

  constructor(receiver: Receiver<T>, size: number, ms: number) {
    super();

    receiver.callback = (value) => {
      clearTimeout(this.#timeout);

      this.#batch.push(value);

      if (this.#batch.length === size) {
        this.sendBatch();
      } else {
        this.#timeout = setTimeout(() => {
          this.sendBatch();
        }, ms);
      }
    };
  }

  private sendBatch() {
    this._send(this.#batch);
    this.#batch = [];
  }
}
