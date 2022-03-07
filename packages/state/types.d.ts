declare module "@woofjs/state" {
  type WatchOptions = {
    /**
     * Run the watcher function right away with the current value.
     */
    immediate: boolean;
  };

  type State<Type> = {
    /**
     * Returns the current value.
     */
    get(): Type;

    /**
     * Returns a nested property from the current value. Works with objects and arrays.
     *
     * @param selector - Property name (e.g. `some.value`, `names[3].first`, `length`)
     */
    get<V = unknown>(selector: string): V;

    /**
     * Returns a new value.
     *
     * @param newValue - Replacement value
     */
    set(newValue: Type): void;

    /**
     * Produces a new value using a function that can either mutate `current` or return a new value.
     * Mutations are applied on a cloned version of `current` that replaces the old one, immutably.
     */
    set(fn: (current: Type) => Type | void): void;

    watch(callback: (current: Type) => void): () => void;
    watch(callback: (current: Type) => void, options: WatchOptions): () => void;
    watch<V = unknown>(selector: string, callback: (selected: V) => void): () => void;
    watch<V = unknown>(selector: string, callback: (selected: V) => void, options: WatchOptions): () => void;

    map(): MapState<Type>;
    map<V = unknown>(selector: string): MapState<V>;
    map<V>(transform: (current: Type) => V): MapState<V>;
    map<V>(selector: string, transform: (selected: unknown) => V): MapState<V>;

    toString(): string;
  };

  /**
   * A read-only state derived from another state. Supports everything a regular State supports besides `.set()`.
   */
  type MapState<Type> = {
    [Property in keyof State<Type> as Exclude<Property, "set">]: State<Type>[Property];
  };

  /**
   * Creates a new state.
   *
   * @param initialValue - Optional starting value
   */
  export function makeState<T>(initialValue?: T): State<T>;

  /**
   * Takes multiple states followed by a function.
   * Each time any of the states' values change, the function is passed the values in the same order to return a new value.
   * Similar to `.map` but with several states being collapsed down to one.
   */
  export function mergeStates<T>(...args: any): State<any>;

  /**
   * Determines whether or not an object is a state.
   */
  export function isState(value: unknown): boolean;
}
