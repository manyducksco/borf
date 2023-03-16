import { Type } from "../Type/Type.js";
import { cloneDeep } from "../helpers/cloneDeep.js";

type HashOptions<K, V> = {
  /**
   * A default value to return when accessing a key that doesn't exist.
   * Can be specified as a plain value, or as a function that returns that value.
   */
  default?: V | ((hash: Hash<K, V>, key: K) => V);

  // TODO: Options for sorting and comparison?
};

/**
 * Like a Map, but better.
 */
export class Hash<K, V> extends Map<K, V> {
  #options: HashOptions<K, V>;

  static isHash<K = unknown, V = unknown>(value: unknown): value is Hash<K, V> {
    return value instanceof Hash;
  }

  constructor(entries?: [K, V][], options?: HashOptions<K, V>);
  constructor(hash: Hash<K, V>, options?: HashOptions<K, V>);
  constructor(iterable: Iterable<[K, V]>, options?: HashOptions<K, V>);
  constructor(object: object, options?: HashOptions<K, V>);

  constructor(init: unknown, options?: HashOptions<K, V>) {
    let entries: [K, V][] = [];

    if (init) {
      // 2D array is assumed to be entries.
      if (Type.isArrayOf(Type.isArray, init)) {
        entries = init as [K, V][];
      } else if (Hash.isHash<K, V>(init)) {
        entries = [...init.entries()];
      } else if (Type.isIterable<[K, V]>(init)) {
        entries = [...init];
      } else if (Type.isObject(init)) {
        entries = Object.entries(init) as [K, V][];
      } else {
        throw new TypeError(
          `Expected an array of entries, a Hash or an object as an init value for Hash. Got: ${init}`
        );
      }
    }

    super(entries);
    this.#options = Object.freeze(options ? { ...options } : {});
  }

  get options() {
    return this.#options;
  }

  /**
   * Returns the key of the first item in the list with `value` as its value. Returns null if value is not present.
   */
  keyOf(value: V): K | null {
    for (const entry of this.entries()) {
      if (entry[1] === value) {
        return entry[0];
      }
    }

    return null;
  }

  /**
   * Returns a new Hash with the specified keys only.
   */
  pick(keys: K[]): Hash<K, V> {
    const picked: [K, V][] = [];

    for (const entry of this.entries()) {
      if (keys.includes(entry[0])) {
        picked.push(entry);
      }
    }

    return new Hash(picked);
  }

  /**
   * Returns a new Hash with all but the specified keys.
   */
  omit(keys: K[]): Hash<K, V> {
    const picked: [K, V][] = [];

    for (const entry of this.entries()) {
      if (!keys.includes(entry[0])) {
        picked.push(entry);
      }
    }

    return new Hash(picked);
  }

  /**
   * Runs each entry through a callback, returning a new Hash
   * with the resulting entries.
   *
   * @param callback - Entry transform function.
   */
  map<TK, TV>(callback: (entry: [K, V]) => [TK, TV]): Hash<TK, TV> {
    const mapped: [TK, TV][] = [];

    for (const entry of this.entries()) {
      mapped.push(callback(entry));
    }

    return new Hash(mapped);
  }

  /**
   * Runs each entry through a callback, returning a new Hash
   * with the entries for which the function returned `true`.
   *
   * @param callback - Entry filter function.
   */
  filter(callback: (entry: [K, V]) => boolean): Hash<K, V> {
    const filtered: [K, V][] = [];

    for (const entry of this.entries()) {
      if (callback(entry)) {
        filtered.push(entry);
      }
    }

    return new Hash(filtered, this.#options);
  }

  /**
   * Returns the first entry, or undefined if the Hash is empty.
   */
  first(): [K, V] | undefined;

  /**
   * Returns an array of the first `count` entries.
   */
  first(count: number): [K, V][];

  first(count?: number) {
    if (count != null) {
      const entries: [K, V][] = [];

      for (const entry of this.entries()) {
        entries.push(entry);

        // Stop at `count`.
        if (entries.length === count) {
          break;
        }
      }

      return entries;
    } else {
      return this.entries().next().value;
    }
  }

  /**
   * Returns the most recent entry, or undefined if the Hash is empty.
   */
  last(): [K, V] | undefined;

  /**
   * Returns an array of the last `count` entries.
   */
  last(count: number): [K, V][];

  last(count?: number) {
    const entries = [...this.entries()];

    if (count != null) {
      return entries.slice(-count);
    } else {
      return entries.pop();
    }
  }

  /**
   * Returns a new Hash with the same values.
   */
  copy(): Hash<K, V> {
    return new Hash([...this.entries()], this.#options);
  }

  /**
   * Returns new hash with deep copies of this hash's entries.
   */
  clone(): Hash<K, V> {
    const copied: [K, V][] = [];

    for (const entry of this.entries()) {
      copied.push([entry[0], cloneDeep(entry[1])]);
    }

    return new Hash(copied, this.#options);
  }

  // merge(other: Map<K, V>): Hash<K, V> {
  //   return new Hash<K, V>([...this.entries(), ...other.entries()]);
  // }

  // mergeClone(other: Map<K, V>): Hash<K, V> {
  //   return new Hash<K, V>([
  //     ...this.clone().entries(),
  //     ...new Hash(other).clone().entries(),
  //   ]);
  // }

  /**
   * Returns this hash's contents as a standard JS Map object.
   */
  toMap() {
    return new Map<K, V>([...this.entries()]);
  }
}
