export type ExposedPromise<T> = Promise<T> & {
  resolve: (result: T) => void;
  reject: (reason: any) => void;
};

/**
 * Create a promise with its resolve and reject functions available on the promise itself.
 */
export function makeExposedPromise<T>(): ExposedPromise<T> {
  let _resolve;
  let _reject;

  const promise: any = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  promise.resolve = _resolve;
  promise.reject = _reject;

  return promise;
}
