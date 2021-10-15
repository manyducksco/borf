import { Receivable, Receiver, Listener } from "./Receivable";

/**
 * Takes a Receiver and a condition function. Returns a new Receivable that gets values
 * only when the condition function returns true for that value.
 *
 * @param receiver - a receiver
 * @param condition - function to decide whether to forward the message
 */
export function filter<T>(
  receiver: Receiver<T>,
  condition: (value: T) => boolean
): Receivable<T> {
  const listener: Listener<T> = { callback: undefined };
  const receivable = new FilteredReceivable<T>(condition, listener);

  receiver.callback = listener.callback;

  return receivable;
}

class FilteredReceivable<T> extends Receivable<T> {
  constructor(condition: (value: T) => boolean, listener: Listener<T>) {
    super();

    listener.callback = (value) => {
      if (condition(value)) {
        this._send(value);
      }
    };
  }
}
