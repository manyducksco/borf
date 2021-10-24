import { map } from "./operators/map";
import { Source } from "./Source";
import { Listenable, Listener, Operator } from "./types";

/**
 * Forwards values sent from a Source through an operator function.
 */
export class Relay<Input, Output = Input> implements Listenable<Output> {
  protected source: Listenable<Input>;
  protected operator: Operator<Input, Output>;

  constructor(source: Listenable<Input>, operator: Operator<Input, Output>) {
    this.source = source;
    this.operator = operator;
  }

  get current() {
    let pulled: Output;

    this.operator(this.source.current, (value) => {
      pulled = value;
    });

    return pulled!;
  }

  listen(callback: Listener<Output>) {
    return this.source.listen((value) => {
      this.operator(value, callback);
    });
  }
}
