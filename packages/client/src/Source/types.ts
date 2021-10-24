export interface Stringifyable {
  toString: () => string;
}

/**
 * Callback function that receives values broadcasted from a Source.
 */
export type Listener<Type> = (value: Type) => void;

/**
 * Object that can take a callback to listen for value changes with a `listen` function.
 * The `listen` function returns a function to cancel it.
 */
export type Listenable<Type> = {
  current: Type;
  listen: (callback: Listener<Type>) => () => void;
};

/**
 * A Receiver that also provides a set function to update the value.
 */
export interface Binding<Type> {
  get: () => Type;
  set: (value: Type) => void;
  listen: (callback: Listener<Type>) => () => void;
}

/**
 * Object that can have its value bound with a `bind` function.
 */
export type Bindable<Type> = {
  bind: () => Binding<Type>;
};

/**
 * A function through which values pass in a Relay.
 * It can choose whether to send and can optionally convert the value before sending.
 */
export type Operator<Input, Output> = (
  value: Input,
  send: (value: Output) => void
) => void;
