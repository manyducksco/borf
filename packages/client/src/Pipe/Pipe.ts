export class Pipe<T, R = any> {
  private receivers: PipeReceiver<T, R>[] = [];
  private data?: T;

  send(data: T, handleReply?: (response?: R) => void) {
    this.data = data;

    for (const receiver of this.receivers) {
      if (receiver.active && receiver.callback) {
        receiver.callback(data, handleReply ?? (() => {}));
      }
    }
  }

  receive(callback?: PipeReceiverCallback<T, R>) {
    const receiver = new PipeReceiver<T, R>(this.cancel.bind(this));

    receiver.current = this.data;
    receiver.callback = callback;

    this.receivers.push(receiver);

    return receiver;
  }

  private cancel(receiver: PipeReceiver<T, any>) {
    this.receivers.splice(this.receivers.indexOf(receiver), 1);
  }
}

export type PipeReceiverCallback<T, R> = (
  data: T,
  reply: (response: R) => void
) => void;

export class PipeReceiver<T, R> {
  active = true;
  current?: T;
  callback?: PipeReceiverCallback<T, R>;
  private _cancel: (receiver: PipeReceiver<T, R>) => void;

  constructor(cancel: (receiver: PipeReceiver<T, R>) => void) {
    this._cancel = cancel;
  }

  cancel() {
    this._cancel(this);
  }
}
