import $$observable from "symbol-observable";
import { isModel, isRecord } from "./makeModel.js";
import { SortedMap } from "./helpers/SortedMap.js";
import { flatMap } from "./helpers/flatMap.js";

/**
 * Creates a new collection of records conforming to a `model` schema.
 *
 * @param model - A model for validation.
 * @param options.sortBy - A property name to sort ascending, or a function that receives two values and returns -1, 1 or 0.
 */
export function collectionOf(model, options = {}) {
  if (!isModel(model)) {
    throw new TypeError(`Expected a model. Received: ${model}`);
  }

  options = options || {};

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

  const store = new SortedMap({
    compare: makeCompareFn(model.schema, options.sortBy),
  });

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

      records = flatMap(records);

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

        validated.push([key, record]);
      }

      const added = [];
      const updated = [];

      for (const [key, record] of validated) {
        const exists = store.has(key);

        store.set(key, record, { sort: false });

        if (exists) {
          added.push(record);
        } else {
          updated.push(record);
        }
      }

      store.sort();

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

      records = flatMap(records);

      for (const record of records) {
        if (typeof record === "object" && record != null) {
          keys.push(record[model.key]);
        } else {
          keys.push(record);
        }
      }

      const deleted = [];

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
    find(selector) {
      const observers = [];
      let promise;
      let previous;

      const calculate = () => {
        if (typeof selector === "function") {
          for (const [key, value] of store) {
            if (selector(value)) {
              return value;
            }
          }
        } else {
          return store.get(selector);
        }
      };

      const createPromise = () => {
        return new Promise((resolve) => {
          return resolve(calculate());
        });
      };

      const update = () => {
        const match = calculate();
        if (match !== previous) {
          previous = match;
          for (const observer of observers) {
            observer.next(match);
          }
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

        [$$observable]() {
          return this;
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

      const createPromise = () => {
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

        [$$observable]() {
          return this;
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

    forEach(callback) {
      for (const entry of store) {
        callback(entry);
      }
    },

    get size() {
      return store.size;
    },
  };
}

function makeCompareFn(schema, sortBy) {
  const type = typeof sortBy;

  if (type === "function") {
    return (a, b) => sortBy(a[1], b[1]);
  }

  if (type === "string") {
    if (!schema._shape.hasOwnProperty(sortBy)) {
      throw new Error(`sortBy key '${sortBy}' is not in the model's schema.`);
    }

    return (a, b) => {
      const aValue = a[1][sortBy];
      const bValue = b[1][sortBy];

      if (aValue < bValue) {
        return -1;
      } else if (aValue > bValue) {
        return 1;
      } else {
        return 0;
      }
    };
  }

  if (type != null && type === "object") {
    const { key, descending } = sortBy;

    if (typeof key !== "string") {
      throw new TypeError(`sortBy.key must be a string. Got: ${key}`);
    }

    if (!schema._shape.hasOwnProperty(key)) {
      throw new Error(`sortBy key '${key}' is not in the model's schema.`);
    }

    if (descending != null && typeof descending !== "boolean") {
      throw new TypeError(
        `sortBy.descending must be a boolean. Got: ${descending}`
      );
    }

    const compare =
      descending === true
        ? (a, b) => (a > b ? -1 : b < a ? 1 : 0)
        : (a, b) => (a < b ? -1 : b > a ? 1 : 0);

    return (a, b) => compare(a[1][key], b[1][key]);
  }
}
