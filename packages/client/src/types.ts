/**
 * One way data binding. Receiver function is called (if defined) each time the value changes while 'active' is true.
 * The cancel function permanently stops receiving new values.
 */
export interface Subscription<T> {
  active: boolean;
  current: T;
  receiver?: (value: T) => void;
  cancel: () => void;
}

/**
 * Two way data binding. A subscription with an extra 'set' function that updates the subscribed value.
 */
export interface Binding<T> extends Subscription<T> {
  set: (value: T) => void;
}
