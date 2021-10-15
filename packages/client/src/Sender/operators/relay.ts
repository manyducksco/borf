import { Sender } from "../Sender";
import { Receiver } from "../Receiver";

/**
 * Takes a Receiver and forwards its values to a new Sender.
 *
 * @param receiver - a receiver
 */
export const relay = <T>(receiver: Receiver<T>) =>
  new RelayedSender<T>(receiver);

class RelayedSender<T> extends Sender<T> {
  constructor(receiver: Receiver<T>) {
    super();
    receiver.callback = this._send.bind(this);
  }
}
