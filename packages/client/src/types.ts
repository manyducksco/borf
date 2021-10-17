export interface Sender<T> {
  receive(callback?: (value: T) => void): Receiver<T>;
}

export interface Receiver<T> {
  callback?: (value: T) => void;
  cancel: () => void;
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
