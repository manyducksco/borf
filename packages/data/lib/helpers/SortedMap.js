export class SortedMap {
  _index = new Map();
  _records = [];
  _options = {};

  constructor(options) {
    this._options = options || {};
  }

  get size() {
    return this._records.length;
  }

  has(key) {
    return this._index.has(key);
  }

  get(key) {
    const index = this._index.get(key);
    return this._records[index]?.[1];
  }

  /**
   * Sets a key/value.
   * If the value is new, `.sort()` will be run automatically unless `options.sort` is `false.
   */
  set(key, value, options = {}) {
    const index = this._index.get(key);
    const record = this._records[index];

    if (record) {
      record[1] = value;
    } else {
      this._records.push([key, value]);
      this._index.set(key, this._records.length - 1);

      if (options.sort !== false) {
        this.sort();
      }
    }
  }

  delete(key) {
    if (this._index.has(key)) {
      const i = this._index.get(key);
      this._records.splice(i, 1);

      const index = new Map();
      for (let i = 0; i < this._records.length; i++) {
        const record = this._records[i];
        index.set(record[0], i);
      }
      this._index = index;

      return true;
    }

    return false;
  }

  keys() {
    return makeIterator(this._records.map((r) => r[0]));
  }

  values() {
    return makeIterator(this._records.map((r) => r[1]));
  }

  entries() {
    return makeIterator(this._records);
  }

  forEach(callback) {
    for (const entry of makeIterator(this._records)) {
      callback(entry);
    }
  }

  [Symbol.iterator]() {
    return makeIterator(this._records);
  }

  /**
   * Sorts records and rebuilds index.
   */
  sort() {
    const compare = this._options.compare;

    if (compare != null) {
      this._records.sort(compare);

      const index = new Map();
      for (let i = 0; i < this._records.length; i++) {
        const record = this._records[i];
        index.set(record[0], i);
      }
      this._index = index;
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
