import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Returns a new Sender that forwards the most recent value within `ms` milliseconds
 * since the last value was sent. All other values sent within that window are ignored.
 *
 * @param receiver - a receiver
 * @param ms - amount of milliseconds to wait
 */
export const debounce = <T>(receiver: Receiver<T>, ms: number) =>
  new DebouncedSender(receiver, ms);

class DebouncedSender<T> extends Sender<T> {
  #timeout?: any;

  constructor(receiver: Receiver<T>, ms: number) {
    super();

    receiver.callback = (value) => {
      clearTimeout(this.#timeout);

      this.#timeout = setTimeout(() => {
        this._send(value);
      }, ms);
    };
  }
}
