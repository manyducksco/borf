import Symbol_observable from "symbol-observable";
import { Type } from "../Type/Type.js";

export interface Observer<T> {
  /**
   * Receives the subscription object when `subscribe` is called.
   */
  start?: (subscription: Subscription) => void;

  /**
   * Receives the next value in the sequence.
   */
  next?: (value: T) => void;

  /**
   * Receives the sequence error.
   */
  error?: (error: Error) => void;

  /**
   * Receives a completion notification.
   */
  complete?: () => void;
}

type SubscriberFunction<T> = (
  observer: SubscriptionObserver<T>
) => void | (() => void) | Subscription;

/**
 * A SubscriptionObserver is a normalized Observer which wraps the observer object supplied to subscribe.
 */
export class SubscriptionObserver<T> {
  #observer: Observer<T>;

  constructor(observer: Observer<T>) {
    this.#observer = observer;
  }

  /**
   * Sends the next value in the sequence.
   */
  next(value: T): void {
    this.#observer.next?.(value);
  }

  /**
   * Sends the sequence error.
   */
  error(error: Error): void {
    this.#observer.error?.(error);
  }

  /**
   * Sends the completion notification.
   */
  complete(): void {
    this.#observer.complete?.();
  }

  get closed(): boolean {
    // TODO: Get real value.
    return false;
  }
}

type SubscriptionOptions = {
  cancel: () => void;
};

export class Subscription {
  #cancel: () => void;
  #closed = false;

  constructor(options: SubscriptionOptions) {
    this.#cancel = options.cancel;
  }

  /**
   * Cancels the subscription.
   */
  unsubscribe() {
    this.#cancel();
    this.#closed = true;
  }

  /**
   *  A boolean value indicating whether the subscription is closed.
   */
  get closed() {
    return this.#closed;
  }
}

/**
 * An implementation of Observable as defined in the TC39 proposal.
 *
 * @see https://github.com/tc39/proposal-observable
 */
export class Observable<T> {
  /**
   * Converts items to an Observable.
   */
  static of<T>(...items: T[]): Observable<T> {
    return new Observable<T>((observer) => {
      for (const item of items) {
        observer.next(item);
      }
      observer.complete();
    });
  }

  /**
   * Converts an Iterable to an Observable.
   */
  static from<U>(iterable: Iterable<U>): Observable<U>;

  /**
   * Converts an Observable to an Observable.
   */
  static from<U>(observable: Observable<U>): Observable<U>;

  static from<U>(source: Iterable<U> | Observable<U>): Observable<U> {
    const fn: unknown = (source as any)[Symbol_observable];

    if (Type.isFunction(fn)) {
      const result = fn();

      if (Type.isObservable<U>(result)) {
        return result;
      } else {
        return Observable.of<U>(result as U);
      }
    } else if (Type.isIterable<U>(source)) {
      // Return an observable of this iterator's values.
      return Observable.of(...source);
    } else {
      throw new TypeError(`Expected an observable or iterable. Got: ${source}`);
    }
  }

  #subscriber: SubscriberFunction<T>;
  #observers: SubscriptionObserver<T>[] = [];

  constructor(subscriber: SubscriberFunction<T>) {
    this.#subscriber = subscriber;
  }

  /**
   * Subscribes to the sequence with an observer.
   */
  subscribe(observer: Observer<T>): Subscription;

  /**
   * Subscribes to the sequence with callbacks.
   */
  subscribe(
    onNext?: (value: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Subscription;

  subscribe(...args: any[]) {
    let observer: Observer<T> = args[0];

    if (Type.isObject(args[0])) {
      observer = args[0];
    } else {
      observer = {
        next: args[0],
        error: args[1],
        complete: args[2],
      };
    }

    const subObserver = new SubscriptionObserver<T>(observer);
    this.#observers.push(subObserver);

    const result = this.#subscriber(subObserver);
    let cleanup: () => void;

    if (result) {
      if (Type.isFunction(result)) {
        cleanup = result; // Returned a cleanup function.
      } else if (Type.isFunction(result.unsubscribe)) {
        cleanup = () => {
          result.unsubscribe(); // Returned a subscription which we will wrap in a cleanup function.
        };
      } else {
        throw new TypeError(
          `Unexpected value returned from subscriber function. Got: ${result}`
        );
      }
    }

    const subscription = new Subscription({
      cancel: () => {
        this.#observers.splice(this.#observers.indexOf(subObserver), 1);

        if (cleanup) {
          cleanup();
        }
      },
    });

    if (Type.isFunction(observer.start)) {
      observer.start(subscription);
    }

    return subscription;
  }

  filter(callback: (value: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      const sub = this.subscribe({
        next(value) {
          if (callback(value)) {
            observer.next(value);
          }
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();
      };
    });
  }

  map<R>(callback: (value: T) => R) {
    return new Observable<R>((observer) => {
      const sub = this.subscribe({
        next(value) {
          observer.next(callback(value));
        },
        error(error) {
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });

      return () => {
        sub.unsubscribe();
      };
    });
  }

  [Symbol_observable]() {
    return this;
  }
}
