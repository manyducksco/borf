import { Receivable, Receiver, Listener } from "./Receivable";

/**
 * Returns a new Receivable that gets the most recent value within `ms` milliseconds
 * since the last value was sent. All other values sent within that window are ignored.
 *
 * @param receiver - a receiver
 * @param ms - amount of milliseconds to wait
 */
export function debounce<T>(receiver: Receiver<T>, ms: number): Receivable<T> {
  const listener: Listener<T> = { callback: undefined };
  const receivable = new DebouncedReceivable<T>(ms, listener);

  receiver.callback = listener.callback;

  return receivable;
}

class DebouncedReceivable<T> extends Receivable<T> {
  #timeout?: any;

  constructor(ms: number, listener: Listener<T>) {
    super();

    listener.callback = (value) => {
      clearTimeout(this.#timeout);

      this.#timeout = setTimeout(() => {
        this._send(value);
      }, ms);
    };
  }
}
