export interface Sender<T> {
  receive(callback?: (value: T) => void): Receiver<T>;
}

export interface Receiver<T> {
  callback?: (value: T) => void;
  cancel: () => void;
}

export interface Stringifyable {
  toString(): string;
}

export interface Subscribable<T> {
  subscribe(): Subscription<T>;
}

/**
 * One way data binding. And initial value paired with a receiver to get updated values.
 * The subscription permanently stops receiving new values when the receiver is cancelled.
 */
export interface Subscription<T> {
  initialValue: T;
  receiver: Receiver<T>;
}

/**
 * Two way data binding. A subscription with an extra 'set' function that updates the subscribed value.
 */
export interface Binding<T> extends Subscription<T> {
  set: (value: T) => void;
}

export interface Subscribable<T> {
  subscribe(): Subscription<T>;
}

export interface Bindable<T> {
  bind(): Binding<T>;
}

/**
 * Receives a message and decides whether to send it and in what form.
 */
export type TransformFunc<I, O> = (
  message: I,
  send: (message: O) => void
) => void;
