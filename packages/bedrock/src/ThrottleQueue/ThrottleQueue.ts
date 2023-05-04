import { isPromise } from "../typeChecking.js";

type ThrottleQueueEvent = "resolve" | "reject" | "complete";

export class ThrottleQueue<T, R> {
  #queue: T[] = [];
  #pending: Promise<R>[] = [];

  #stopped = false;
  #maxPerSecond: number;
  #callback: (item: T) => Promise<R>;

  // Array of timestamps of recently started items in old -> new order
  #timestamps: number[] = [];

  #listeners: Record<ThrottleQueueEvent, ((...args: any[]) => void)[]> = {
    resolve: [],
    reject: [],
    complete: [],
  };

  /**
   * Print debug logs when true.
   */
  debug: boolean = false;

  get stopped() {
    return this.#stopped;
  }

  get length() {
    return this.#queue.length;
  }

  constructor(
    maxPerSecond: number,
    callback: (item: T) => Promise<R>,
    items?: T[]
  ) {
    if (items) {
      this.#queue.push(...items);
    }

    this.#maxPerSecond = maxPerSecond;
    this.#callback = callback;
  }

  on(event: "resolve", callback: (item: T, result: R) => void): void;
  on(event: "reject", callback: (item: T, error: Error) => void): void;
  on(event: "complete", callback: () => void): void;

  /**
   * Subscribes to an event with a callback.
   */
  on(event: ThrottleQueueEvent, callback: (...args: any[]) => void) {
    this.#log({ method: "on", event, callback });
    this.#listeners[event].push(callback);
  }

  /**
   * Adds new items to the queue.
   */
  add(...items: T[]) {
    this.#log({ method: "add", items });
    this.#queue.push(...items);
    this.#next();
  }

  /**
   * Stops processing of new queue items. Pending queue items will continue to resolve.
   */
  start() {
    this.#log({ method: "start" });
    this.#stopped = false;
    this.#next();
  }

  /**
   * Starts processing of queue items.
   */
  stop() {
    this.#log({ method: "stop" });
    this.#stopped = true; // Don't allow any new items to process until resumed.
  }

  get #log() {
    if (this.debug) {
      return console.log.bind(
        console,
        `[PerSecondQueue@${new Date().toISOString()}]`
      );
    } else {
      return () => {};
    }
  }

  #next() {
    if (this.#queue.length === 0 && this.#pending.length === 0) {
      this.#emit("complete");
      return;
    }

    if (this.#stopped) return;

    while (this.#pending.length < this.#maxPerSecond) {
      const earliest = this.#timestamps.at(0);
      const now = Date.now();

      const shouldStartNext = earliest ? now - earliest > 1000 : true;

      // if (!shouldStartNext) {
      //   console.log("BOUNCIN");
      //   continue;
      // }

      const next = this.#queue.shift();

      if (!next) {
        break;
      }

      const promise = this.#callback(next);

      if (!isPromise<R>(promise)) {
        throw new TypeError(
          `PerSecondQueue callback must always return a Promise.`
        );
      }

      this.#pending.push(promise);

      this.#log({
        method: "#next",
        value: next,
        message: "starting new Promise",
        queued: this.#queue.length,
        pending: this.#pending.length,
      });

      promise
        .then((result) => {
          this.#emit("resolve", next, result);
        })
        .catch((error) => {
          this.#emit("reject", next, error);
        })
        .finally(() => {
          this.#pending.splice(this.#pending.indexOf(promise), 1);
          this.#next();
        });

      this.#timestamps.push(Date.now());
      while (this.#timestamps.length > this.#maxPerSecond) {
        this.#timestamps.shift();
      }
    }
  }

  #emit(event: "resolve", item: T, result: R): void;
  #emit(event: "reject", item: T, error: Error): void;
  #emit(event: "complete"): void;

  #emit(event: ThrottleQueueEvent, ...args: unknown[]) {
    this.#log({
      method: "#emit",
      event,
      args,
      listeners: this.#listeners[event].length,
    });

    for (const callback of this.#listeners[event]) {
      callback(...args);
    }
  }
}
