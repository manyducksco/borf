import { Dictionary } from "Dictionary/Dictionary";
import { List } from "List/List.js";

export class Loop {
  static times(
    count: number,
    callback: (value: number, stop: () => void) => Promise<void>
  ): Promise<void>;

  static times(
    count: number,
    callback: (value: number, stop: () => void) => void
  ): void;

  static times(
    count: number,
    callback: (value: number, stop: () => void) => unknown
  ) {
    let stopped = false;
    const first = callback(1, () => {
      stopped = true;
    });

    if (first instanceof Promise) {
      if (stopped) {
        return new Promise<void>((resolve) => first.then(() => resolve()));
      }

      return new Promise<void>(async (resolve) => {
        await first;
        for (let i = 2; i <= count; i++) {
          const result = callback(i, () => {
            i = count + 1; // Stop iteration.
          });

          if (result instanceof Promise) {
            await result;
          }
        }
        resolve();
      });
    } else {
      if (stopped) {
        return;
      }

      for (let i = 2; i <= count; i++) {
        callback(i, () => {
          i = count + 1; // Stop iteration.
        });
      }
    }
  }

  /**
   * Loop through each item in an array, calling `callback` with each.
   * The `callback` receives a `stop()` function as its third parameter,
   * providing a way to stop iterating from within the loop.
   *
   * @param array - Array to iterate.
   * @param callback - Callback to run for each item.
   */
  static each<T>(
    array: T[],
    callback: (item: T, index: number, stop: () => void) => void
  ): void;

  /**
   * Loop through each item in an array, calling `callback` with each.
   * The `callback` receives a `stop()` function as its third parameter,
   * providing a way to stop iterating from within the loop.
   *
   * @param array - Array to iterate.
   * @param callback - Callback to run for each item.
   */
  static each<T>(
    array: T[],
    callback: (item: T, index: number, stop: () => void) => Promise<void>
  ): Promise<void>;

  static each<O, K extends keyof O>(
    object: O,
    callback: (value: O[K], key: K, stop: () => void) => void
  ): void;

  static each<O, K extends keyof O>(
    object: O,
    callback: (value: O[K], key: K, stop: () => void) => Promise<void>
  ): Promise<void>;

  static each<T>(
    iterable: Iterable<T>,
    callback: (item: T, index: number, stop: () => void) => void
  ): void;

  static each<T>(
    iterable: Iterable<T>,
    callback: (item: T, index: number, stop: () => void) => Promise<void>
  ): Promise<void>;

  static each(iterable: unknown, callback: unknown) {}

  static until(callback: (stop: () => void) => Promise<void>): Promise<void>;
  static until(callback: (stop: () => void) => void): void;
  static until(callback: (stop: () => void) => unknown) {
    let stopped = false;
    const first = callback(() => {
      stopped = true;
    });

    if (first instanceof Promise) {
      if (stopped) {
        return new Promise<void>((resolve) => first.then(() => resolve()));
      }

      return new Promise<void>(async (resolve) => {
        await first;
        while (!stopped) {
          const result = callback(() => {
            stopped = true;
          });

          if (result instanceof Promise) {
            await result;
          }
        }
        resolve();
      });
    } else {
      while (!stopped) {
        callback(() => {
          stopped = true;
        });
      }
    }
  }

  static batchQueue<V, R>(
    iterable: Iterable<V>,
    limit: number,
    callback: (item: V, index: number, stop: () => void) => Promise<R>
  ): Promise<List<R>> {}
}
