import { Receivable, Receiver, Listener } from "./Receivable";

/**
 * Takes a Receiver and a transform function. Returns a new Receivable that gets the result
 * of the transform function.
 *
 * @param receiver - a receiver
 * @param transform - function to transform value from receiver
 */
export function map<T, V>(
  receiver: Receiver<T>,
  transform: (value: T) => V
): Receivable<V> {
  const listener: Listener<T> = { callback: undefined };
  const receivable = new MappedReceivable<T, V>(transform, listener);

  receiver.callback = listener.callback;

  return receivable;
}

class MappedReceivable<T, V> extends Receivable<V> {
  constructor(transform: (value: T) => V, listener: Listener<T>) {
    super();

    listener.callback = (value) => {
      this._send(transform(value));
    };
  }
}
