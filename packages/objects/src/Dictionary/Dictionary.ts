type DictionaryOptions<K, V> = {
  /**
   * A default value to return when accessing a key that doesn't exist.
   * Can be specified as a plain value, or as a function that returns that value.
   */
  default?: V | ((dict: Dictionary<K, V>, key: K) => V);

  // TODO: Options for sorting and comparison?
};

/**
 * Like an Object, but better.
 */
export class Dictionary<K, V> extends Map<K, V> {
  #options: DictionaryOptions<K, V>;

  constructor(entries?: [K, V][], options?: DictionaryOptions<K, V>) {
    super(entries);
    this.#options = options || {};
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
   * Returns a new Dictionary with the specified keys only.
   */
  pick(keys: K[]): Dictionary<K, V> {
    const picked: [K, V][] = [];

    for (const entry of this.entries()) {
      if (keys.includes(entry[0])) {
        picked.push(entry);
      }
    }

    return new Dictionary<K, V>(picked);
  }

  /**
   * Runs each entry through a callback, returning a new Dictionary
   * with the resulting entries.
   *
   * @param callback - Entry transform function.
   */
  map<TK, TV>(callback: (entry: [K, V]) => [TK, TV]): Dictionary<TK, TV> {
    const mapped: [TK, TV][] = [];

    for (const entry of this.entries()) {
      mapped.push(callback(entry));
    }

    return new Dictionary<TK, TV>(mapped);
  }

  /**
   * Runs each entry through a callback, returning a new Dictionary
   * with the entries for which the function returned `true`.
   *
   * @param callback - Entry filter function.
   */
  filter(callback: (entry: [K, V]) => boolean): Dictionary<K, V> {
    const filtered: [K, V][] = [];

    for (const entry of this.entries()) {
      if (callback(entry)) {
        filtered.push(entry);
      }
    }

    return new Dictionary<K, V>(filtered);
  }

  /**
   * Returns a shallow copy of this dictionary.
   */
  copy(): Dictionary<K, V> {
    return new Dictionary([...this.entries()], this.#options);
  }

  /**
   * Returns a deep copy of this dictionary.
   */
  clone() {}

  /**
   * Returns this Dictionary's contents as a standard JS Map object.
   */
  toMap() {
    return new Map<K, V>([...this.entries()]);
  }
}
