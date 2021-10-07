import { State, StateOptions } from "./State";

/**
 * Create a new state tracker.
 */
export function create<T>(initialState: T, options?: StateOptions) {
  return new State<T>(initialState, options);
}
