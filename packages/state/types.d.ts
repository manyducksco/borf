declare module "@woofjs/state" {
  type WatchOptions = {
    /**
     * Run the watcher function right away with the current value.
     */
    immediate: boolean;
  };

  type State<Type> = {
    /**
     * Gets the current value.
     */
    get(): Type;

    /**
     * Gets a nested property from the current value. Works with objects and arrays.
     *
     * @param key - Property name (e.g. 'some.value', 'names[3].first', 'length')
     */
    get<V = unknown>(key: string): V;

    /**
     * Sets a new value.
     *
     * @param newValue - Replacement value
     */
    set(newValue: Type): void;

    /**
     * Updates the value with a function. If the function returns a value, that value replaces the current one.
     * If null, then any mutations to `current` will be applied to create a new value.
     */
    set(fn: (current: Type) => Type | void): void;

    watch(callback: (current: Type) => void): () => void;
    watch(callback: (current: Type) => void, options: WatchOptions): () => void;
    watch<V = unknown>(key: string, callback: (selected: V) => void): () => void;
    watch<V = unknown>(key: string, callback: (selected: V) => void, options: WatchOptions): () => void;

    map(): MapState<Type>;
    map<V = unknown>(key: string): MapState<V>;
    map<V>(transform: (current: Type) => V): MapState<V>;
    map<V>(key: string, transform: (selected: unknown) => V): MapState<V>;

    toString(): string;
  };

  type MapState<Type> = {
    [Property in keyof State<Type> as Exclude<Property, "get">]: State<Type>[Property];
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
