import { isString, isObject, isArray } from "../__utils";
import { Binding, Subscription, Receiver } from "../types";

export type StateOptions = {
  /**
   * Amount of undo steps to keep in history. Defaults to 10.
   */
  undoLimit?: number;
};

/**
 * States are immutable state containers that support subscribing to changes.
 * When states change, subscribers are notified to trigger DOM updates, API calls or whatever else they need to do.
 * States keep a history of previous state snapshots and support rewinding states with .undo() and forwarding with .redo()
 */
export class State<T> {
  history: T[] = []; // state snapshots
  index = 0; // current position in state snapshots
  subscriptions: StateSubscription<T, any>[] = []; // active subscriptions
  undoLimit = 10;

  get current() {
    return this.history[this.index];
  }

  constructor(initialState: T, options?: StateOptions) {
    this.pushState(initialState);

    if (options?.undoLimit) {
      this.undoLimit = options?.undoLimit;
    }
  }

  undo(steps = 1) {
    const last = this.current;

    // sets index back by 'steps' until the start of history
    this.index = Math.max(0, this.index - steps);

    const next = this.current;
    const changed = this.diffChangedKeys(last, next);

    this.notifySubscribers(changed);
  }

  redo(steps = 1) {
    const last = this.current;

    // sets index forward by 'steps' until the end of history
    this.index = Math.min(this.history.length - 1, this.index + steps);

    const next = this.current;
    const changed = this.diffChangedKeys(last, next);

    this.notifySubscribers(changed);
  }

  /**
   * Sets a key to a new value.
   *
   * @param key - name of the prop to set
   * @param value - new prop value
   */
  set(key: keyof T, value: any): this;

  /**
   * Sets multiple keys and values from an object.
   *
   * @param object - object with keys and their new values
   */
  set(object: Partial<T>): this;

  set(keyOrObject: keyof T | Partial<T>, value?: any) {
    if (isString(keyOrObject)) {
      const key = keyOrObject as keyof T;

      if (this.current[key] !== value) {
        this.pushState({
          ...this.current,
          [key]: value,
        });

        this.notifySubscribers([key]);
      }

      return this;
    }

    if (isObject(keyOrObject)) {
      const current = this.current;
      const patch = keyOrObject as Partial<T>;
      const merged = Object.assign({}, current, patch);

      const changed = this.diffChangedKeys(current, merged);

      if (changed.length > 0) {
        this.pushState(merged);
        this.notifySubscribers(changed);
      }

      return this;
    }

    throw new TypeError(
      `Expected a key and value or an object of keys and values but received: ${typeof keyOrObject} and ${typeof value}`
    );
  }

  /**
   * Subscribe for notifications when a certain key is changed.
   */
  subscribe(key: keyof T, callback?: (value: any) => any) {
    const sub = new StateSubscription<T, any>(this, key);

    if (callback) {
      sub.receiver.callback = callback;
    }

    this.subscriptions.push(sub);

    return sub;
  }

  /**
   * Create a two way binding object that can set the bound value as well as receive changes.
   */
  bind(key: keyof T, callback?: (value: any) => any) {
    const binding = new StateBinding<T, any>(this, key);

    if (callback) {
      binding.receiver.callback = callback;
    }

    this.subscriptions.push(binding);

    return binding;
  }

  /**
   * Computes a new value from a key each time its value changes.
   */
  map<V>(key: keyof T, compute: (...values: any) => V): MappedValue<T, V>;

  /**
   * Computes a new value from multiple keys each time any of their values change.
   */
  map<V>(
    keys: Array<keyof T>,
    compute: (...values: any) => V
  ): MappedValue<T, V>;

  map<V>(
    keyOrKeys: keyof T | Array<keyof T>,
    compute: (...values: any) => V
  ): MappedValue<T, V> {
    return new MappedValue<T, V>(this, keyOrKeys, compute);
  }

  /**
   * Appends a new state to history and performs data maintenance as needed.
   */
  private pushState(newState: T) {
    // freeze object to prevent changes once it's in history
    const historyItem = Object.freeze(Object.assign({}, newState));

    // discard any 'future' states and append new state at the current index
    this.history = [...this.history.slice(0, this.index + 1), historyItem];

    Object.freeze(this.history);

    // move index to new state
    this.index = this.history.length - 1;

    // truncate items from beginning if history is longer than undo limit
    if (this.history.length > this.undoLimit) {
      this.history = this.history.slice(this.index - this.undoLimit + 1);
      this.index -= this.index - this.undoLimit + 1;
    }
  }

  /**
   * Runs receivers for all subscriptions on keys with updated values.
   */
  protected notifySubscribers(keys: Array<keyof T>) {
    if (keys.length === 0) return;

    const current = this.current;

    for (const sub of this.subscriptions) {
      if (!sub.paused && sub.receiver.callback && keys.includes(sub.key)) {
        sub.receiver.callback(current[sub.key]);
      }
    }
  }

  /**
   * Gets a list of keys that have different values between two state snapshots.
   */
  private diffChangedKeys(one: T, two: T) {
    const changed = new Set<keyof T>();

    for (const key in one) {
      if (!this.isEqual(one[key], two[key])) {
        changed.add(key);
      }
    }

    for (const key in two) {
      if (!this.isEqual(one[key], two[key])) {
        changed.add(key);
      }
    }

    return Array.from(changed.keys());
  }

  /**
   * Determines if a one value is equal to another.
   * This function allows for changing the method of comparison in the future.
   */
  private isEqual(one: any, two: any) {
    return one === two;
  }
}

export class StateSubscription<T, V> implements Subscription<V> {
  protected state: State<T>;
  key: keyof T;
  paused = false;
  receiver: Receiver<V>;

  get initialValue() {
    return this.state.current[this.key] as any;
  }

  constructor(state: State<T>, key: keyof T) {
    this.state = state;
    this.key = key;
    this.receiver = {
      cancel: () => {
        state.subscriptions.splice(state.subscriptions.indexOf(this), 1);
      },
    };
  }
}

export class StateBinding<T, V>
  extends StateSubscription<T, V>
  implements Binding<V>
{
  /**
   * Updates the value of the subscribed key in state.
   */
  set(value: V) {
    this.state.set(this.key, value);
  }
}

/**
 * Listens for changes on one or more keys and computes a new value with a custom function
 * when any of the keys get new values.
 */
export class MappedValue<T, V> {
  private state: State<T>;
  private compute: (...values: any) => V;
  private keys: Array<keyof T> = [];
  private value!: V;
  private subscriptions: Subscription<V>[] = [];

  get current() {
    return this.value;
  }

  constructor(
    state: State<T>,
    keyOrKeys: Array<keyof T> | keyof T,
    compute: (...values: any) => V
  ) {
    this.state = state;
    this.keys = this.parseKeys(keyOrKeys);
    this.compute = compute;

    for (const key of this.keys) {
      this.state.subscribe(key, this.receive.bind(this));
    }

    this.receive(); // get initial value
  }

  private parseKeys(keyOrKeys: Array<keyof T> | keyof T): Array<keyof T> {
    if (isString(keyOrKeys)) {
      return [keyOrKeys as keyof T];
    }

    if (isArray(keyOrKeys)) {
      return keyOrKeys as Array<keyof T>;
    }

    throw new Error(
      `Expected a key or array of keys but received: ${typeof keyOrKeys}`
    );
  }

  /**
   * Runs receivers for all subscriptions.
   */
  private notifySubscribers() {
    for (const sub of this.subscriptions) {
      if (sub.receiver.callback) {
        sub.receiver.callback(this.value);
      }
    }
  }

  /**
   * Called when subscribed keys get new values.
   */
  private receive() {
    const current = this.state.current;
    const values = this.keys.map((key) => current[key]);

    const computed = this.compute(...values);

    if (this.value !== computed) {
      this.value = computed;
      this.notifySubscribers();
    }
  }

  subscribe(callback?: (value: V) => void): Subscription<V> {
    // store cancelled state and cached current value
    // current should stop changing when this sub is cancelled
    let cancelled = false;
    let current = this.current;

    const getCurrent = () => {
      if (!cancelled) {
        current = this.current;
      }

      return current;
    };

    const sub = {
      paused: false,
      get initialValue() {
        return getCurrent();
      },
      receiver: {
        cancel: () => {
          cancelled = true;
          this.subscriptions.splice(this.subscriptions.indexOf(sub), 1);
        },
        callback,
      },
    };

    this.subscriptions.push(sub);

    return sub;
  }
}
