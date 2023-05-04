import { isPromise } from "../typeChecking.js";

type BatchQueueEvent = "resolve" | "reject" | "complete";

export class BatchQueue<T, R> {
  #queue: T[] = [];
  #pending: Promise<R>[] = [];

  #stopped = false;
  #batchSize: number;
  #callback: (item: T) => Promise<R>;

  #listeners: Record<BatchQueueEvent, ((...args: any[]) => void)[]> = {
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
    batchSize: number,
    callback: (item: T) => Promise<R>,
    items?: T[]
  ) {
    if (items) {
      this.#queue.push(...items);
    }

    this.#batchSize = batchSize;
    this.#callback = callback;
  }

  on(event: "resolve", callback: (item: T, result: R) => void): void;
  on(event: "reject", callback: (item: T, error: Error) => void): void;
  on(event: "complete", callback: () => void): void;

  /**
   * Subscribes to an event with a callback.
   */
  on(event: BatchQueueEvent, callback: (...args: any[]) => void) {
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
        `[BatchQueue@${new Date().toISOString()}]`
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

    while (this.#pending.length < this.#batchSize) {
      const next = this.#queue.shift();

      if (!next) {
        break;
      }

      const promise = this.#callback(next);

      if (!isPromise<R>(promise)) {
        throw new TypeError(
          `BatchQueue callback must always return a Promise.`
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
    }
  }

  #emit(event: "resolve", item: T, result: R): void;
  #emit(event: "reject", item: T, error: Error): void;
  #emit(event: "complete"): void;

  #emit(event: BatchQueueEvent, ...args: unknown[]) {
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
