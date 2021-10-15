import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Returns a new Sender that forwards values only when the condition returns truthy for that value.
 *
 * @param receiver - a receiver
 * @param condition - function to decide whether to forward the message
 */
export const filter = <T>(
  receiver: Receiver<T>,
  condition: (value: T) => boolean
) => new FilteredSender(receiver, condition);

class FilteredSender<T> extends Sender<T> {
  constructor(receiver: Receiver<T>, condition: (value: T) => boolean) {
    super();

    receiver.callback = (value) => {
      if (condition(value)) {
        this._send(value);
      }
    };
  }
}
