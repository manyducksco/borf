import { Receivable, Receiver, Listener } from "./Receivable";

/**
 * Returns a new Receivable that ignores all values for `ms` milliseconds after a value is sent.
 *
 * @param receiver - a receiver
 * @param ms - amount of milliseconds to wait
 */
export function throttle<T>(receiver: Receiver<T>, ms: number): Receivable<T> {
  const listener: Listener<T> = { callback: undefined };
  const receivable = new ThrottledReceivable<T>(ms, listener);

  receiver.callback = listener.callback;

  return receivable;
}

class ThrottledReceivable<T> extends Receivable<T> {
  #next: number = 0;

  constructor(ms: number, listener: Listener<T>) {
    super();

    listener.callback = (value) => {
      const now = Date.now();

      if (now >= this.#next) {
        this._send(value);
        this.#next = now + ms;
      }
    };
  }
}
