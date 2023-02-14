import type { Observer, Subscription } from "Observable/Observable";

interface ListOptions<T> {
  /**
   * Configure comparisons with .has, .remove and others that compare items by value.
   * By default items are compared with '===' strict equality.
   */
  isEqual?: (item: T, other: unknown) => boolean;

  /**
   * Validate items being added to the list. An error is thrown if this function returns false.
   */
  isValid?: (item: unknown) => boolean;

  /**
   * A compare function to sort list items.
   */
  sortBy?: (a: T, b: T) => number;
}

/**
 * Like an Array, but better.
 */
export class List<T> extends Array<T> {
  #options: ListOptions<T>;

  static isList(value: unknown) {
    return value instanceof List;
  }

  static first<T>(list: Array<T>) {
    return list[0];
  }

  static last<T>(list: Array<T>) {
    return list[list.length - 1];
  }

  constructor(items: T[] = [], options?: ListOptions<T>) {
    super();
    this.#options = options || {};

    if (items.length > 0) {
      this.#validate(...items);
      this.push(...items);
    }
  }

  #validate(...items: T[]) {
    if (this.#options.isValid) {
      for (const item of items) {
        if (!this.#options.isValid(item)) {
          throw new Error(`Item is not valid in this list: ${item}`);
        }
      }
    }
  }

  /**
   * Adds `items` to the end of this list.
   *
   * @alias .add()
   *
   * @param items
   * @returns new list length
   */
  override push(...items: T[]): number {
    this.#validate(...items);
    const length = super.push(...items);
    this.sort();

    return length;
  }

  /**
   * Sorts the list by `compareFn`, falling back to `options.sortBy` if not passed.
   */
  override sort(compareFn?: (a: T, b: T) => number) {
    if (!compareFn) {
      compareFn = this.#options.sortBy;
    }

    if (compareFn) {
      super.sort(compareFn);
    }

    return this;
  }

  override slice(start?: number, end?: number): List<T> {
    return new List(super.slice(start, end));
  }

  override map<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any
  ): List<U> {
    return new List(super.map(callbackfn), thisArg);
  }

  override flatMap<U, This = undefined>(
    callback: (
      this: This,
      value: T,
      index: number,
      array: T[]
    ) => U | readonly U[],
    thisArg?: This | undefined
  ): List<U> {
    return new List(super.flatMap(callback, thisArg));
  }

  override filter(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any
  ): List<T> {
    return new List<T>(super.filter(predicate, thisArg));
  }

  /**
   * Adds `items` to the end of this list.
   *
   * @alias .push()
   *
   * @param items
   * @returns new list length
   */
  append(...items: T[]): number {
    return this.push(...items);
  }

  /**
   * Adds `items` to the beginning of this list.
   *
   * @alias .unshift()
   *
   * @param items
   * @returns new list length
   */
  prepend(...items: T[]): number {
    return this.unshift(...items);
  }

  /**
   * Adds `items` to the list at `index`.
   *
   * @param index - Index to insert at.
   * @param items - Items to insert.
   */
  insertAt(index: number, ...items: T[]) {
    this.splice(index, 0, ...items);
    return this.length;
  }

  /**
   * Removes `item` from this list.
   *
   * @param item - Item to remove from the list.
   */
  remove(item: T) {
    const index = this.findIndex((x) => {
      if (this.#options.isEqual) {
        return this.#options.isEqual(x, item);
      } else {
        return x === item;
      }
    });

    if (index > -1) {
      this.splice(index, 1);
    }

    return this;
  }

  /**
   * Removes all items that match the `filter`.
   *
   * @param filter
   */
  removeWhere(filter: (item: T) => boolean) {
    let toRemove: number[] = [];

    for (let i = 0; i < this.length; i++) {
      if (filter(this[i])) {
        toRemove.push(i - toRemove.length);
      }
    }

    toRemove.forEach((index) => {
      this.splice(index, 1);
    });
  }

  /**
   * Removes item at `index`. If called with a `count`, removes `count` items starting at `index`.
   *
   * @param index - Index to start at for removing.
   * @param count - Number of items to remove, starting at `index`.
   */
  removeAt(index: number, count: number = 1) {
    this.splice(index, count);
    return this.length;
  }

  /**
   * Removes all items from this list.
   */
  clear() {
    while (this.length > 0) {
      this.pop();
    }
  }

  /**
   * Removes all `undefined` or `null` items.
   */
  compact() {
    let i = 0;
    while (i < this.length) {
      if (this[i] == null) {
        this.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * Returns `true` if `item` is present.
   *
   * @alias .contains(), .includes()
   *
   * @param  item - Item to check
   */
  has(item: T) {
    const match = this.find((x) => {
      if (this.#options.isEqual) {
        return this.#options.isEqual(x, item);
      } else {
        return x === item;
      }
    });

    if (match) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Returns true if `item` is present.
   *
   * @alias .has(), .includes()
   *
   * @param item - Item to check
   */
  contains(item: T) {
    return this.has(item);
  }

  /**
   * Returns `true` if `item` is present.
   *
   * @alias .has(), .contains()
   *
   * @param item - Item to check
   */
  includes(item: T) {
    return this.has(item);
  }

  /**
   * Returns the index of `item` in this list, or -1 if not present.
   *
   * @param item - Item to index
   */
  indexOf(item: T): number {
    return this.findIndex((x) => {
      if (this.#options.isEqual) {
        return this.#options.isEqual(x, item);
      } else {
        return x === item;
      }
    });
  }

  /**
   * Returns a new list with any items that match `filter`. In other words,
   * those items for which the `filter` function returned true.
   *
   * @param filter - Filter function
   */
  pick(filter: (item: T) => boolean): List<T> {
    return new List(super.filter(filter));
  }

  /**
   * Returns the first item in the list. Returns undefined if the list is empty.
   */
  first(): T | undefined;

  /**
   * Returns the first `count` items as a new list.
   *
   * @param count - Maximum number of items to return.
   */
  first(count: number): List<T>;

  first(count?: number) {
    if (count == null) {
      if (this.length > 0) {
        return this[0];
      }
    } else {
      return new List(this.slice(0, count));
    }
  }

  /**
   * Returns the last item in the list. Returns undefined if the list is empty.
   */
  last(): T | undefined;

  /**
   * Returns the last `count` items as a new list.
   *
   * @param count - Maximum number of items to return.
   */
  last(count: number): List<T>;

  last(count?: number) {
    if (count == null) {
      if (this.length > 0) {
        return this[this.length - 1];
      }
    } else {
      return new List(this.slice(-count));
    }
  }

  /**
   * Returns the first item in the list.
   */
  head() {
    return this[0];
  }

  /**
   * Returns a new list of all items except the first.
   */
  tail() {
    return new List(this.slice(1), this.#options);
  }

  /**
   * Returns another List that is a shallow copy of this List.
   */
  clone() {
    return new List<T>([...this], this.#options);
  }

  /**
   * Returns another List with a deep copy of this List's items.
   */
  cloneDeep() {
    // TODO: Implement
    throw new Error("Not yet implemented.");
  }

  /**
   * Returns this list as a plain JavaScript array.
   */
  toArray() {
    return Array.from(this);
  }

  // subscribe(
  //   onNext?: (next: T) => void,
  //   onError?: (error: Error) => void,
  //   onComplete?: () => void
  // ): Subscription;
  // subscribe(observer: Observer<T>): Subscription;
  // subscribe(observer: unknown): Subscription {}
}
