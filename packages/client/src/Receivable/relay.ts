import { Receivable, Receiver, Listener } from "./Receivable";

/**
 * Takes a Receiver and forwards its values to a new Receivable.
 *
 * @param receiver - a receiver
 */
export function relay<T>(receiver: Receiver<T>): Receivable<T> {
  const listener: Listener<T> = { callback: undefined };
  const receivable = new RelayedReceivable<T>(listener);

  receiver.callback = listener.callback;

  return receivable;
}

class RelayedReceivable<T> extends Receivable<T> {
  constructor(listener: Listener<T>) {
    super();

    listener.callback = this._send.bind(this);
  }
}
