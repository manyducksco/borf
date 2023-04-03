import { PubSub } from "../PubSub/PubSub.js";

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
  #pubsub = new PubSub<S>();

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
      this.#pubsub.publish(nextState);

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

  /**
   * Subscribe to state changes with a `callback` function. Returns an unsubscribe function.
   */
  subscribe(callback: (state: S) => void) {
    return this.#pubsub.subscribe(callback);
  }
}
