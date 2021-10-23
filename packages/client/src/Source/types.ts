/**
 * Callback function that receives values broadcasted from a Source.
 */
export type Listener<T> = (value: T) => void;

/**
 * Object that supplies methods for receiving values from a Source.
 */
export type Receiver<T> = {
  pull: () => T;
  listen: (callback: Listener<T>) => () => void;
};

/**
 * A Receiver that also provides a set function to update the value.
 */
export interface Binding<T> extends Receiver<T> {
  set: (value: T) => void;
}

/**
 * Object with a value that can be received through a `receive` function.
 */
export type Receivable<T> = {
  receive: () => Receiver<T>;
};

/**
 * A function through which values pass in a Relay.
 * It can choose whether to send and can optionally convert the value before sending.
 */
export type Operator<I, O> = (value: I, send: (value: O) => void) => void;
