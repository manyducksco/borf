import { Listener, Operator, Receivable, Receiver } from "./types";

/**
 * Forwards values sent from a Source through an operator function.
 */
export class Relay<Input, Output = Input> implements Receivable<Output> {
  protected source: Receivable<Input>;
  protected operator: Operator<Input, Output>;
  protected receiver: Receiver<Input>;

  constructor(source: Receivable<Input>, operator: Operator<Input, Output>) {
    this.source = source;
    this.operator = operator;
    this.receiver = source.receive();
  }

  /**
   * Returns an object with methods for receiving values. The `pull` function retrieves the current value on demand,
   * while the `listen` function takes a callback and returns a function to cancel the listener.
   */
  receive(): Receiver<Output> {
    const { receiver, operator } = this;

    return {
      pull: () => {
        let pulled: Output;

        operator(receiver.pull(), (value) => {
          pulled = value;
        });

        return pulled!;
      },
      listen: (callback: Listener<Output>) => {
        return receiver.listen((value) => {
          operator(value, callback);
        });
      },
    };
  }
}
