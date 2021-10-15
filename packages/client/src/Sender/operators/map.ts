import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Returns a new Sender that forwards the result of the `transform` function for each value.
 *
 * @param receiver - a receiver
 * @param transform - function to transform value from receiver
 */
export const map = <T, V>(receiver: Receiver<T>, transform: (value: T) => V) =>
  new MappedSender(receiver, transform);

class MappedSender<T, V> extends Sender<V> {
  constructor(receiver: Receiver<T>, transform: (value: T) => V) {
    super();

    receiver.callback = (value) => {
      this._send(transform(value));
    };
  }
}
