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

      // TODO: Silently ignore keys that aren't in the store?
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

    async filter(fn) {
      const { controller, object } = makeSubscribableThenable({
        subscribe: (observer) => {},
        unsubscribe: (observer) => {},
      });

      return object;
    },

    [Symbol.iterator]: function* () {
      for (const [key, value] of store) {
        yield value;
      }
    },
  };
}

/**
 * Create an object that functions as either a promise or an observable.
 * `.then()` or `await` will unsubscribe after receiving the first value,
 * while `.subscribe()` will return a subscription that keeps listening
 * until manually unsubscribed.
 */
// function makeSubscribableThenable(unsubscribe) {
//   const observers = [];
//   let promise;

//   const controller = {
//     next(...args) {
//       for (const observer of observers) {
//         observer.next(...args);
//       }
//     },
//   };

//   const object = {
//     subscribe(observer) {
//       if (typeof observer === "function") {
//         observer = {
//           next: observer,
//           error: arguments[1],
//           complete: arguments[2],
//         };
//       }

//       observers.push(observer);

//       return {
//         unsubscribe: () => {
//           observers.splice(observers.indexOf(observer), 1);
//         },
//       };
//     },

//     then() {},

//     catch() {},

//     finally() {},
//   };

//   return { controller, object };
// }
