import { Receiver } from "../Sender";

/**
 * One way data binding. Receiver gets the value each time it changes while 'active' is true.
 * The cancel function permanently stops receiving new values.
 */
export interface Subscription<T> {
  active: boolean;
  current: T;
  receiver: Receiver<T>;
  cancel: () => void;
}

/**
 * Two way data binding. A subscription with an extra 'set' function that updates the subscribed value.
 */
export interface Binding<T> extends Subscription<T> {
  set: (value: T) => void;
}
