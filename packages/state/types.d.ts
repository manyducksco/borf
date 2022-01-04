declare module "@woofjs/state" {
  type WatchOptions = {
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

  type Getters<T> = {
    [name in keyof T]: <V>(current: T, ...args: any[]) => V;
  };

  export function makeGetters<T>(state: State<T>, getters: Getters<T>): Getters<T>;
  export function makeGetters<T>(getters: Getters<T>): (state: State<T>) => Getters<T>;

  type Setters<T> = {
    [name in keyof T]: <V>(current: T, ...args: any[]) => V;
  };

  export function makeSetters<T>(state: State<T>, setters: Setters<T>): Setters<T>;
  export function makeSetters<T>(setters: Setters<T>): (state: State<T>) => Setters<T>;

  export function combineStates(): State<any>;
}
