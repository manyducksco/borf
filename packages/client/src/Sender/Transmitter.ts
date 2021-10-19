import { Receiver, Sender, TransformFunc } from "../types";
import { isReceiver, isSender } from "../utils";

/**
 * Implementation of a Sender that manages a pool of receivers.
 */
export class Transmitter<I, O = I> implements Sender<O> {
  protected _source?: Receiver<I>;
  protected _receivers: Receiver<O>[] = [];

  constructor(
    source?: Sender<I> | Receiver<I>,
    transform?: TransformFunc<I, O>
  ) {
    if (source) {
      if (isSender(source)) {
        this._source = source.receive();
      } else if (isReceiver(source)) {
        this._source = source;
      } else {
        throw new Error(
          `Expected source to be a Sender or Receiver but got ${typeof source}`
        );
      }

      if (transform) {
        const send = this._send.bind(this);
        this._source.callback = (message) => {
          transform(message, send);
        };
      } else {
        throw new Error(
          `Expected a transform function when a source is provided.`
        );
      }
    }
  }

  receive(callback?: (value: O) => void): Receiver<O> {
    const cancel = this._cancel.bind(this);
    const receiver = {
      cancel() {
        cancel(receiver);
      },
      callback,
    };

    this._receivers.push(receiver);
    return receiver;
  }

  map<R>(transform: (value: O) => R) {
    return new Transmitter<O, R>(this, (message, send) => {
      send(transform(message));
    });
  }

  /**
   * Sends data to all receivers.
   *
   * @param message - Data to send
   */
  protected _send(message: O) {
    for (const receiver of this._receivers) {
      if (receiver.callback) {
        receiver.callback(message);
      }
    }
  }

  /**
   * Cancels a receiver, preventing it from receiving any new messages.
   *
   * @param receiver - Receiver to cancel
   */
  protected _cancel(receiver: Receiver<O>) {
    this._receivers.splice(this._receivers.indexOf(receiver), 1);
  }
}
