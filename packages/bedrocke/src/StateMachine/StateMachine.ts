import Symbol_observable from "symbol-observable";
import {
  Observable,
  Observer,
  Subscription,
} from "../Observable/Observable.js";

interface StateConfig<S, T extends string> {
  signals: Partial<Record<T, S>>;
}

/**
 * A finite state machine that uses named signals to transition between states.
 */
export class StateMachine<
  S extends string | number | symbol,
  T extends string = string
> {
  #currentState: S;
  #states: Record<S, StateConfig<S, T>>;
  #observers: ((state: S) => void)[] = [];

  constructor(initialState: S, states: Record<S, StateConfig<S, T>>) {
    this.#currentState = initialState;
    this.#states = states;
  }

  /**
   * The current state.
   */
  get state() {
    return this.#currentState;
  }

  /**
   * Returns an array of signals that `state` will respond to.
   */
  signalsOf(state: S) {
    return Object.keys(this.#states[state]?.signals || {});
  }

  /**
   * Sends a signal to the state machine. If the current state responds to the signal,
   * a transition is made and the state changes.
   *
   * @param name - Name of a signal to send.
   * @param callback - Optional, receives info about the transition operation.
   */
  signal(
    name: T,
    callback?: (changed: boolean, newState: S, oldState: S) => void
  ) {
    const nextState = this.#states[this.#currentState].signals[name];

    if (nextState != null && nextState !== this.#currentState) {
      const oldState = this.#currentState;
      this.#currentState = nextState;
      this.#observers.forEach((callback) => callback(nextState));

      if (callback) {
        callback(true, nextState, oldState);
      }

      return true;
    } else {
      if (callback) {
        callback(false, this.#currentState, this.#currentState);
      }

      return false;
    }
  }

  [Symbol_observable]() {
    return this;
  }

  /**
   * Subscribes to the state with an observer.
   */
  subscribe(observer: Observer<S>): Subscription;

  /**
   * Subscribes to the state with callbacks.
   */
  subscribe(
    onNext?: (value: S) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Subscription;

  subscribe(...args: any[]) {
    return new Observable((observer) => {
      observer.next(this.#currentState);

      const update = (state: S) => {
        observer.next(state);
      };

      this.#observers.push(update);

      return () => {
        this.#observers.splice(this.#observers.indexOf(update), 1);
      };
    }).subscribe(...args);
  }
}
