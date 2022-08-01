import { isModel, isRecord } from "./makeModel.js";

export function collectionOf(model) {
  if (!isModel(model)) {
    throw new TypeError(`Expected a model. Received: ${model}`);
  }

  const listeners = {
    add: [],
    update: [],
    delete: [],
  };
  const emit = (event, ...args) => {
    for (const callback of listeners[event]) {
      callback(...args);
    }
  };

  const store = new Map();

  return {
    on(event, callback) {
      if (listeners[event] == null) {
        throw new Error(
          `Failed to subscribe; collection does not emit '${event}' event.`
        );
      }

      listeners[event].push(callback);

      return function cancel() {
        listeners[event].splice(listeners[event].indexOf(callback), 1);
      };
    },

    /**
     * Gets one record by key.
     */
    async get(key) {
      return store.get(key);
    },

    /**
     * Insert or update one or more records.
     */
    async set(...records) {
      const validated = [];

      for (let i = 0; i < records.length; i++) {
        let record = records[i];

        if (isRecord(record)) {
          record = record.toObject();
        }

        const { valid, errors, key } = model.validate(record);

        if (!valid) {
          console.error(errors);
          throw new TypeError(
            `Record ${
              records.length > 1 ? `at index ${i} ` : ""
            }failed validation.`
          );
        }

        validated.push({ key, record });
      }

      const added = [];
      const updated = [];

      for (const { key, record } of validated) {
        const exists = !!store.get(key);

        store.set(key, record);

        if (exists) {
          added.push(record);
        } else {
          updated.push(record);
        }
      }

      if (added.length > 0) {
        emit("add", added);
      }

      if (updated.length > 0) {
        emit("update", updated);
      }
    },

    /**
     * Remove one or more records.
     */
    async delete(...records) {
      const keys = [];

      for (const record of records) {
        if (typeof record === "object" && record != null) {
          keys.push(record[model.key]);
        } else {
          keys.push(record);
        }
      }

      const deleted = [];

      // console.log(keys);
      for (const key of keys) {
        const record = store.get(key);

        if (record) {
          store.delete(key);
          deleted.push(record);
        }
      }

      if (deleted.length > 0) {
        emit("delete", deleted);
      }
    },

    /**
     * Delete all records from this collection.
     */
    async clear() {
      const deleted = [];

      for (const [key, value] of store) {
        store.delete(key);
        deleted.push(value);
      }

      if (deleted.length > 0) {
        emit("delete", deleted);
      }
    },

    /**
     * Gets the first record with matching key or that receives a true value after being passed through a lookup function.
     */
    async find(keyOrFn) {},

    filter(fn) {
      const observers = [];
      let promise;

      const calculate = () => {
        const matches = [];
        for (const [key, value] of store) {
          if (fn(value)) {
            matches.push(value);
          }
        }
        return matches;
      };

      const createPromise = (observable) => {
        return new Promise((resolve) => {
          return resolve(calculate());
        });
      };

      const update = () => {
        const matches = calculate();
        for (const observer of observers) {
          observer.next(matches);
        }
      };

      return {
        subscribe(observer) {
          if (promise != null) {
            throw new Error(
              `This Observable has already been converted to a Promise.`
            );
          }

          if (typeof observer === "function") {
            observer = {
              next: observer,
              error: arguments[1],
              complete: arguments[2],
            };
          }

          if (observers.length === 0) {
            listeners["add"].push(update);
            listeners["update"].push(update);
            listeners["delete"].push(update);
          }

          observers.push(observer);
          observer.next(calculate());

          return {
            unsubscribe: () => {
              observers.splice(observers.indexOf(observer), 1);

              if (observers.length === 0) {
                listeners["add"].splice(listeners["add"].indexOf(update), 1);
                listeners["update"].splice(
                  listeners["update"].indexOf(update),
                  1
                );
                listeners["delete"].splice(
                  listeners["delete"].indexOf(update),
                  1
                );
              }
            },
          };
        },

        then(...args) {
          if (!promise) {
            promise = createPromise();
          }

          return promise.then(...args);
        },

        catch(...args) {
          if (!promise) {
            promise = createPromise();
          }

          return promise.catch(...args);
        },

        finally(...args) {
          if (!promise) {
            promise = createPromise();
          }

          return promise.finally(...args);
        },
      };
    },

    [Symbol.iterator]: function* () {
      for (const [key, value] of store) {
        yield value;
      }
    },
  };
}
