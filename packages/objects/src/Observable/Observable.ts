export interface ObserverLike<T> {
  next?: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}

export class Observer<T> {
  #onNext?: (value: T) => void;
  #onError?: (error: Error) => void;
  #onComplete?: () => void;

  constructor(
    onNext?: (value: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  );
  constructor(observer: ObserverLike<T>);
  constructor(...args: any[]) {
    if (typeof args[0] === "function") {
      this.#onNext = args[0];
      this.#onError = args[1];
      this.#onComplete = args[2];
    } else {
      this.#onNext = args[0].next;
      this.#onError = args[0].error;
      this.#onComplete = args[0].complete;
    }
  }

  next(value: T) {
    if (this.#onNext) {
      this.#onNext(value);
    }
  }
  error(error: Error) {
    if (this.#onError) {
      this.#onError(error);
    }
  }
  complete() {
    if (this.#onComplete) {
      this.#onComplete();
    }
  }
}

export interface Subscriber<T> {
  next(value: T): void;
  error(error: Error): void;
  complete(): void;
}

export class Subscription {
  #cancel: () => void;

  constructor(cancel: () => void) {
    this.#cancel = cancel;
  }

  unsubscribe() {
    this.#cancel();
  }
}

export class Observable<T> {
  #observers: Observer<T>[] = [];

  constructor(fn: (subscriber: Subscriber<T>) => void) {
    fn(this.#subscriber());
  }

  #subscriber(): Subscriber<T> {
    return {
      next: (value: T) => {
        for (const observer of this.#observers) {
          observer.next(value);
        }
      },
      error: (error: Error) => {
        for (const observer of this.#observers) {
          observer.error(error);
        }
      },
      complete: () => {
        for (const observer of this.#observers) {
          observer.complete();
        }
      },
    };
  }

  subscribe(
    onNext?: (value: T) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Subscription;
  subscribe(observer: ObserverLike<T>): Subscription;
  subscribe(...args: any[]) {
    const observer = new Observer<T>(...args);
    this.#observers.push(observer);

    return new Subscription(() => {
      this.#observers.splice(this.#observers.indexOf(observer), 1);
    });
  }

  // [Symbol.observable]() {
  //   return this;
  // }

  // isObservable(value: unknown) {
  //   return (
  //     value != null &&
  //     typeof value === "object" &&
  //     typeof (value as any)[Symbol.observable] === "function" &&
  //     (value as any)[Symbol.observable]() === value
  //   );
  // }
}
