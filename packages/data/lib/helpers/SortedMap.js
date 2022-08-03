export class SortedMap {
  #index = new Map();
  #records = [];
  #options = {};

  constructor(options) {
    this.#options = options || {};
  }

  get size() {
    return this.#records.length;
  }

  has(key) {
    return this.#index.has(key);
  }

  get(key) {
    const index = this.#index.get(key);
    return this.#records[index]?.[1];
  }

  /**
   * Sets a key/value.
   * If the value is new, `.sort()` will be run automatically unless `options.sort` is `false.
   */
  set(key, value, options = {}) {
    const index = this.#index.get(key);
    const record = this.#records[index];

    if (record) {
      record[1] = value;
    } else {
      this.#records.push([key, value]);
      this.#index.set(key, this.#records.length - 1);

      if (options.sort !== false) {
        this.sort();
      }
    }
  }

  delete(key) {
    if (this.#index.has(key)) {
      const i = this.#index.get(key);
      this.#records.splice(i, 1);

      const index = new Map();
      for (let i = 0; i < this.#records.length; i++) {
        const record = this.#records[i];
        index.set(record[0], i);
      }
      this.#index = index;

      return true;
    }

    return false;
  }

  keys() {
    return makeIterator(this.#records.map((r) => r[0]));
  }

  values() {
    return makeIterator(this.#records.map((r) => r[1]));
  }

  entries() {
    return makeIterator(this.#records);
  }

  forEach(callback) {
    for (const entry of makeIterator(this.#records)) {
      callback(entry);
    }
  }

  [Symbol.iterator]() {
    return makeIterator(this.#records);
  }

  /**
   * Sorts records and rebuilds index.
   */
  sort() {
    const compare = this.#options.compare;

    if (compare != null) {
      this.#records.sort(compare);

      const index = new Map();
      for (let i = 0; i < this.#records.length; i++) {
        const record = this.#records[i];
        index.set(record[0], i);
      }
      this.#index = index;
    }
  }
}

function makeIterator(arr) {
  let index = 0;

  return {
    next() {
      if (index < arr.length) {
        return {
          value: arr[index++],
          done: false,
        };
      } else {
        return {
          done: true,
        };
      }
    },
  };
}
