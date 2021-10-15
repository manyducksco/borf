import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Returns a new Sender that ignores all values for `ms` milliseconds after a value is sent.
 *
 * @param receiver - a receiver
 * @param ms - amount of milliseconds to wait
 */
export const throttle = <T>(receiver: Receiver<T>, ms: number) =>
  new ThrottledSender(receiver, ms);

class ThrottledSender<T> extends Sender<T> {
  #next: number = 0;

  constructor(receiver: Receiver<T>, ms: number) {
    super();

    receiver.callback = (value) => {
      const now = Date.now();

      if (now >= this.#next) {
        this._send(value);
        this.#next = now + ms;
      }
    };
  }
}
