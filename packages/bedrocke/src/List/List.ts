import type { Observer, Subscription } from "../Observable/Observable";

import Symbol_observable from "symbol-observable";
import { Observable, SubscriptionObserver } from "../Observable/Observable.js";
import { cloneDeep } from "../helpers/cloneDeep.js";

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
 * An observable superset of Array with added convenience methods.
 */
export class List<T> extends Array<T> {
  #options: ListOptions<T>;
  #observers: SubscriptionObserver<this>[] = [];
  #observable = new Observable<this>((observer) => {
    this.#observers.push(observer);

    return () => {
      this.#observers.splice(this.#observers.indexOf(observer), 1);
    };
  });

  static isList(value: unknown) {
    return value instanceof List;
  }

  static firstOf<T>(list: Array<T>): T;
  static firstOf<T>(list: Array<T>, count: number): T[];

  static firstOf<T>(list: Array<T>, count?: number) {
    if (count != null) {
      return list.slice(0, count);
    } else {
      return list[0];
    }
  }

  static lastOf<T>(list: Array<T>): T;
  static lastOf<T>(list: Array<T>, count: number): T[];

  static lastOf<T>(list: Array<T>, count?: number) {
    if (count != null) {
      return list.slice(-count);
    } else {
      return list[list.length - 1];
    }
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

  #broadcast() {
    for (const observer of this.#observers) {
      observer.next(this);
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
    this.#broadcast();

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

    this.#broadcast();
    return this;
  }

  override slice(start?: number, end?: number): List<T> {
    return new List(super.slice(start, end));
  }

  override splice(start: number, deleteCount?: number | undefined): List<T>;
  override splice(start: number, deleteCount: number, ...items: T[]): List<T>;

  override splice(start: number, deleteCount?: number, ...rest: T[]): List<T> {
    return new List(super.splice(start, deleteCount!, ...rest));
  }

  /**
 * Returns a new List with all items transformed through `callbackfn`.

 * @param {Function} callbackfn - Takes an item from this list and returns the corresponding item for the new list.
 */
  override map<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any
  ): List<U> {
    return new List<U>(super.map(callbackfn, thisArg));
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
   * Adds `items` to the end of the list.
   */
  append(...items: T[]) {
    this.push(...items);
    this.#broadcast();
    return this;
  }

  /**
   * Adds `items` to the beginning of the list.
   */
  prepend(...items: T[]) {
    this.unshift(...items);
    this.#broadcast();
    return this;
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

    this.#broadcast();
    return this;
  }

  /**
   * Removes all items for which `filter` returns true.
   *
   * @param filter
   */
  removeWhere(filter: (item: T) => boolean) {
    let i = 0;
    while (i < this.length) {
      // Remove item for which filter returns true, otherwise move to next index.
      if (filter(this[i])) {
        this.splice(i, 1);
      } else {
        i++;
      }
    }

    this.#broadcast();
    return this;
  }

  /**
   * Adds `items` to the list at `index`.
   *
   * @param index - Index to insert at.
   * @param items - Items to insert.
   */
  insertAt(index: number, ...items: T[]) {
    this.splice(index, 0, ...items);
    this.#broadcast();
    return this;
  }

  /**
   * Removes item at `index`. If called with a `count`, removes `count` items starting at `index`.
   *
   * @param index - Index to start at for removing.
   * @param count - Number of items to remove, starting at `index`.
   */
  removeAt(index: number, count: number = 1) {
    this.splice(index, count);
    this.#broadcast();
    return this;
  }

  /**
   * Removes all items from this list.
   */
  clear() {
    while (this.length > 0) {
      this.pop();
    }

    this.#broadcast();
    return this;
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

    this.#broadcast();
    return this;
  }

  /**
   * Keeps only the first `count` items from the start of the list.
   * Returns a list of dropped items.
   *
   * @param count - Maximum quantity of items to keep
   */
  keepFirst(count: number = 1): List<T> {
    return this.splice(count, this.length - count);
  }

  /**
   * Keeps only the last `count` items from the end of the list.
   * Returns a list of dropped items.
   *
   * @param  count - Maximum quantity of items to keep
   */
  keepLast(count: number = 1): List<T> {
    return this.splice(0, this.length - count);
  }

  /**
   * Drops the first `count` items from the start of the list.
   * Returns a list of dropped items.
   *
   * @param count - Number of items to drop. Defaults to 1.
   */
  dropFirst(count: number = 1): List<T> {
    return this.splice(0, count);
  }

  /**
   * Drops the last `count` items from the end of the list.
   * Returns a list of dropped items.
   *
   * @param count - Number of items to drop. Defaults to 1.
   */
  dropLast(count: number = 1): List<T> {
    return this.splice(-count, this.length);
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
  copy() {
    return new List<T>([...this], this.#options);
  }

  /**
   * Returns another List with a deep copy of this List's items.
   */
  clone() {
    return new List<T>(
      this.map((value) => cloneDeep(value)).toArray(),
      this.#options
    );
  }

  /**
   * Returns this list as a plain JavaScript array.
   */
  toArray() {
    return Array.from(this);
  }

  [Symbol_observable]() {
    return this.#observable;
  }

  subscribe(
    onNext?: (next: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Subscription;
  subscribe(observer: Observer<T>): Subscription;

  subscribe(...args: any[]): Subscription {
    return this.#observable.subscribe(...args);
  }
}
