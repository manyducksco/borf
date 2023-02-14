// import { Observable, Subscriber } from "../Observable/Observable.js";

export class StateMachine<S extends string | number | symbol> {
  #state: S;
  #transitions: Record<S, S[]>;

  constructor(initialState: S, transitions: Record<S, S[]>) {
    this.#state = initialState;
    this.#transitions = transitions;
  }

  get state() {
    return this.#state;
  }

  to(state: S) {
    if (this.#transitions[this.#state].includes(state)) {
      this.#state = state;
      return true;
    }

    return false;
  }
}
