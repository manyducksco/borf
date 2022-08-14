import observable from "symbol-observable";
import { freeze, produce } from "immer";
import { isObject, isFunction } from "./helpers/typeChecking.js";
import { deepEqual } from "./helpers/deepEqual.js";
import { getProperty } from "./helpers/getProperty.js";

export class State {
  #value;
  #observers = [];

  constructor(initialValue) {
    this.#value = freeze(initialValue, true);
  }

  static merge(...states) {
    return new StateMerge(states);
  }

  get(...selectors) {
    let value = this.#value;

    for (const selector of selectors) {
      value = getProperty(value, selector);
    }

    return value;
  }

  set(value) {
    if (isFunction(value)) {
      value = produce(this.#value, value);
    }

    if (!deepEqual(this.#value, value)) {
      this.#value = value;

      for (const observer of this.#observers) {
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

    observer.next(this.#value);

    this.#observers.push(observer);

    return {
      unsubscribe: () => {
        this.#observers.splice(this.#observers.indexOf(observer), 1);
      },
    };
  }

  toString() {
    return String(this.#value);
  }

  [observable]() {
    return this;
  }

  get isState() {
    return true;
  }
}

class StateMerge {
  #states = [];

  constructor(states) {
    this.#states = states;
  }

  into(fn) {}
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
  #source;
  #transform;

  constructor(source, transform) {
    super(undefined);

    this.#source = source;
    this.#transform = transform;
  }

  get(...selectors) {
    let value = this.#transform(this.#source.get());

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

    return this.#source.subscribe((value) => {
      value = this.#transform(value);

      if (!deepEqual(value, previous)) {
        previous = value;
        observer.next(value);
      }
    });
  }

  toString() {
    return this.#source.toString();
  }
}
