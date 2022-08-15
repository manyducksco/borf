import observable from "symbol-observable";
import { freeze, produce } from "immer";
import { isObject, isFunction } from "./helpers/typeChecking.js";
import { deepEqual } from "./helpers/deepEqual.js";
import { getProperty } from "./helpers/getProperty.js";

export class State {
  _value;
  _observers = [];

  constructor(initialValue) {
    this._value = freeze(initialValue, true);
  }

  static merge(...states) {
    return new StateMerge(states);
  }

  get(...selectors) {
    let value = this._value;

    for (const selector of selectors) {
      value = getProperty(value, selector);
    }

    return value;
  }

  set(value) {
    if (isFunction(value)) {
      value = produce(this._value, value);
    }

    if (!deepEqual(this._value, value)) {
      this._value = value;

      for (const observer of this._observers) {
        observer.next(value);
      }
    }
  }

  map(...selectors) {
    return new MappedState(this, (value) => {
      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
    });
  }

  subscribe(observer) {
    if (!isObject(observer)) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    observer.next(this._value);

    this._observers.push(observer);

    return {
      unsubscribe: () => {
        this._observers.splice(this._observers.indexOf(observer), 1);
      },
    };
  }

  toString() {
    return String(this._value);
  }

  [observable]() {
    return this;
  }

  get isState() {
    return true;
  }
}

/**
 *
 */
class StateMerge {
  _states = [];
  _observers = [];

  constructor(states) {
    this._states = states;
  }

  /**
   * Returns a new state by passing all state values through `fn`.
   *
   * @param fn - Function that receives state values and returns the new merged value.
   */
  into(fn) {
    return new MergedState(this._states, fn);
  }

  /**
   * Add more states to the list of states to merge.
   *
   * @example
   * State.merge($state1).with($state2).into((one, two) => one + two);
   */
  with(...states) {
    return new StateMerge([...this._states, ...states]);
  }
}

class ReadOnlyState extends State {
  constructor(initialValue) {
    super(initialValue);
  }

  set() {
    throw new Error("Can't set a read-only state.");
  }
}

class MappedState extends ReadOnlyState {
  _source;
  _transform;

  constructor(source, transform) {
    super(undefined);

    this._source = source;
    this._transform = transform;
  }

  get(...selectors) {
    let value = this._transform(this._source.get());

    for (const selector of selectors) {
      value = getProperty(value, selector);
    }

    return value;
  }

  map(...selectors) {
    return new MappedState(this, (value) => {
      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
    });
  }

  subscribe(observer) {
    if (typeof observer !== "object" || observer === null) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    let previous;

    return this._source.subscribe((value) => {
      value = this._transform(value);

      if (!deepEqual(value, previous)) {
        previous = value;
        observer.next(value);
      }
    });
  }

  toString() {
    return this._source.toString();
  }
}

class MergedState extends ReadOnlyState {
  _states = [];
  _observing = false;
  _merge;

  _stateSubscriptions = [];
  _stateValues = [];

  constructor(states, merge) {
    super(undefined);
    this._states = states;
    this._merge = merge;
  }

  get(...selectors) {
    let value;

    if (this._observing) {
      value = this._value;
    } else {
      value = this._merge(...this._states.map((state) => state.get()));
    }

    for (const selector of selectors) {
      value = getProperty(value, selector);
    }

    return value;
  }

  map(...selectors) {
    return new MappedState(this, (value) => {
      for (const selector of selectors) {
        value = getProperty(value, selector);
      }

      return value;
    });
  }

  subscribe(observer) {
    if (!isObject(observer)) {
      observer = {
        next: observer,
        error: arguments[1],
        complete: arguments[2],
      };
    }

    this._observers.push(observer);

    if (!this._observing) {
      this._subscribeToStates();
    } else {
      observer.next(this.get());
    }

    return {
      unsubscribe: () => {
        this._observers.splice(this._observers.indexOf(observer), 1);

        if (this._observers.length === 0) {
          this._unsubscribeFromStates();
        }
      },
    };
  }

  toString() {
    return String(this.get());
  }

  _updateValue() {
    const value = this._merge(...this._stateValues);

    if (!deepEqual(value, this._value)) {
      this._value = value;

      for (const observer of this._observers) {
        observer.next(value);
      }
    }
  }

  _subscribeToStates() {
    if (!this._observing) {
      for (let i = 0; i < this._states.length; i++) {
        const $state = this._states[i];

        this._stateSubscriptions.push(
          $state.subscribe({
            next: (value) => {
              this._stateValues[i] = value;

              if (observing) {
                this._updateValue();
              }
            },
          })
        );
      }

      this._observing = true;
      this._updateValue();
    }
  }

  _unsubscribeFromStates() {
    this._observing = false;

    for (const sub of this._stateSubscriptions) {
      sub.unsubscribe();
    }
  }
}
