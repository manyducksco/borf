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

class StateMerge {
  _states = [];
  _observers = [];

  constructor(states) {
    this._states = states;
  }

  into(fn) {
    return new MergedState(this._states, fn);
  }

  #subscribeToStates() {}
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
  _observers = [];
  _observing = false;
  _merge;

  constructor(states, merge) {
    this._states = states;
    this._merge = merge;
  }
}
